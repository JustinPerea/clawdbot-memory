import type Database from 'better-sqlite3';

export interface Chunk {
  id: number;
  path: string;
  start_line: number;
  end_line: number;
  text: string;
  hash: string;
}

export interface SearchResult {
  id: number;
  path: string;
  start_line: number;
  end_line: number;
  text: string;
  score: number;
  match_type: 'vector' | 'text' | 'hybrid';
}

export class MemoryQueries {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // Insert a new chunk
  insertChunk(chunk: Omit<Chunk, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO chunks (path, start_line, end_line, text, hash)
      VALUES (@path, @start_line, @end_line, @text, @hash)
    `);
    const result = stmt.run(chunk);
    return Number(result.lastInsertRowid);
  }

  // Insert embedding for a chunk
  insertEmbedding(chunkId: number, embedding: Float32Array): void {
    const buffer = Buffer.from(embedding.buffer);

    // Insert into vec0 table
    const vecResult = this.db.prepare(`
      INSERT INTO chunks_vec (embedding) VALUES (vec_f32(?))
    `).run(buffer);

    // Insert mapping
    this.db.prepare(`
      INSERT INTO chunks_vec_map (vec_rowid, chunk_id) VALUES (?, ?)
    `).run(Number(vecResult.lastInsertRowid), chunkId);
  }

  // Insert chunk with embedding in a transaction
  insertChunkWithEmbedding(chunk: Omit<Chunk, 'id'>, embedding: Float32Array): number {
    const insertTransaction = this.db.transaction(() => {
      const chunkId = this.insertChunk(chunk);
      this.insertEmbedding(chunkId, embedding);
      return chunkId;
    });
    return insertTransaction();
  }

  // Check if chunk exists by hash
  getChunkByHash(hash: string): Chunk | undefined {
    return this.db.prepare(`SELECT * FROM chunks WHERE hash = ?`).get(hash) as Chunk | undefined;
  }

  // Delete chunks for a file (for re-indexing)
  deleteChunksForPath(path: string): void {
    const deleteTransaction = this.db.transaction(() => {
      const chunks = this.db.prepare(`SELECT id FROM chunks WHERE path = ?`).all(path) as { id: number }[];

      for (const chunk of chunks) {
        const mapping = this.db.prepare(`SELECT vec_rowid FROM chunks_vec_map WHERE chunk_id = ?`).get(chunk.id) as { vec_rowid: number } | undefined;
        if (mapping) {
          this.db.prepare(`DELETE FROM chunks_vec WHERE rowid = ?`).run(mapping.vec_rowid);
          this.db.prepare(`DELETE FROM chunks_vec_map WHERE vec_rowid = ?`).run(mapping.vec_rowid);
        }
      }

      this.db.prepare(`DELETE FROM chunks WHERE path = ?`).run(path);
    });
    deleteTransaction();
  }

  // Vector search using sqlite-vec
  vectorSearch(queryEmbedding: Float32Array, limit: number = 10): SearchResult[] {
    const queryBuffer = Buffer.from(queryEmbedding.buffer);

    const stmt = this.db.prepare(`
      SELECT
        c.id, c.path, c.start_line, c.end_line, c.text, v.distance
      FROM chunks_vec v
      INNER JOIN chunks_vec_map m ON m.vec_rowid = v.rowid
      INNER JOIN chunks c ON c.id = m.chunk_id
      WHERE embedding MATCH vec_f32(?)
        AND k = ?
      ORDER BY distance
    `);

    const results = stmt.all(queryBuffer, limit) as Array<Chunk & { distance: number }>;

    return results.map((r) => ({
      id: r.id,
      path: r.path,
      start_line: r.start_line,
      end_line: r.end_line,
      text: r.text,
      score: 1 / (1 + r.distance),
      match_type: 'vector' as const,
    }));
  }

  // Full-text search using FTS5 with BM25
  textSearch(query: string, limit: number = 10): SearchResult[] {
    try {
      const stmt = this.db.prepare(`
        SELECT c.id, c.path, c.start_line, c.end_line, c.text, bm25(chunks_fts) as score
        FROM chunks_fts fts
        INNER JOIN chunks c ON c.id = fts.rowid
        WHERE chunks_fts MATCH ?
        ORDER BY score
        LIMIT ?
      `);

      const results = stmt.all(query, limit) as Array<Chunk & { score: number }>;

      const maxScore = Math.max(...results.map((r) => Math.abs(r.score)), 1);
      return results.map((r) => ({
        id: r.id,
        path: r.path,
        start_line: r.start_line,
        end_line: r.end_line,
        text: r.text,
        score: Math.abs(r.score) / maxScore,
        match_type: 'text' as const,
      }));
    } catch {
      return [];
    }
  }

  // Hybrid search with Reciprocal Rank Fusion (70/30 weighting)
  hybridSearch(
    queryEmbedding: Float32Array,
    textQuery: string,
    limit: number = 10,
    minScore: number = 0.35
  ): SearchResult[] {
    const k = 60; // RRF constant

    const vectorResults = this.vectorSearch(queryEmbedding, limit * 2);
    const textResults = this.textSearch(textQuery, limit * 2);

    const vectorRanks = new Map<number, number>();
    const textRanks = new Map<number, number>();

    vectorResults.forEach((r, idx) => vectorRanks.set(r.id, idx + 1));
    textResults.forEach((r, idx) => textRanks.set(r.id, idx + 1));

    const allIds = new Set([...vectorRanks.keys(), ...textRanks.keys()]);
    const rrfScores: Array<{ id: number; score: number; result: SearchResult }> = [];

    for (const id of allIds) {
      const vectorRank = vectorRanks.get(id);
      const textRank = textRanks.get(id);

      const vectorRRF = vectorRank ? 1 / (k + vectorRank) : 0;
      const textRRF = textRank ? 1 / (k + textRank) : 0;

      const combinedScore = 0.7 * vectorRRF + 0.3 * textRRF;
      const result = vectorResults.find((r) => r.id === id) || textResults.find((r) => r.id === id);

      if (result && combinedScore >= minScore * (1 / (k + 1))) {
        rrfScores.push({
          id,
          score: combinedScore,
          result: { ...result, score: combinedScore, match_type: 'hybrid' },
        });
      }
    }

    return rrfScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.result);
  }

  // Embedding cache operations
  getCachedEmbedding(hash: string): Float32Array | null {
    const result = this.db.prepare(`SELECT embedding FROM embedding_cache WHERE hash = ?`).get(hash) as { embedding: Buffer } | undefined;
    if (result) {
      return new Float32Array(result.embedding.buffer.slice(result.embedding.byteOffset, result.embedding.byteOffset + result.embedding.byteLength));
    }
    return null;
  }

  setCachedEmbedding(hash: string, embedding: Float32Array): void {
    this.db.prepare(`INSERT OR REPLACE INTO embedding_cache (hash, embedding) VALUES (?, ?)`).run(hash, Buffer.from(embedding.buffer));
  }

  // Get all indexed paths
  getIndexedPaths(): string[] {
    const results = this.db.prepare(`SELECT DISTINCT path FROM chunks`).all() as { path: string }[];
    return results.map((r) => r.path);
  }
}
