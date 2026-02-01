import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { MarkdownChunker, createChunker } from './chunker.js';
import { OllamaEmbedder, createEmbedder, createDatabaseCache } from './embedder.js';
import { MemoryQueries } from '../db/queries.js';
import type { Chunk } from '../db/queries.js';

interface IndexResult {
  path: string;
  chunks_created: number;
  skipped: boolean;
  error?: string;
}

// Memory files to index
const MEMORY_FILES = ['MEMORY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md'];

export class MemoryIndexer {
  private chunker: MarkdownChunker;
  private embedder: OllamaEmbedder;
  private queries: MemoryQueries;
  private projectRoot: string;

  constructor(queries: MemoryQueries, projectRoot: string) {
    this.queries = queries;
    this.projectRoot = projectRoot;
    this.chunker = createChunker();

    const cache = createDatabaseCache(
      {
        getCachedEmbedding: (hash) => this.queries.getCachedEmbedding(hash),
        setCachedEmbedding: (hash, embedding) => this.queries.setCachedEmbedding(hash, embedding),
      }
    );
    this.embedder = createEmbedder(cache);
  }

  private generateHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  async indexFile(path: string, forceReindex: boolean = false): Promise<IndexResult> {
    const absolutePath = path.startsWith('/') ? path : join(this.projectRoot, path);
    const relativePath = path.startsWith('/') ? path.replace(this.projectRoot + '/', '') : path;

    try {
      const content = await readFile(absolutePath, 'utf-8');
      const fileHash = this.generateHash(content);

      // Check if file needs reindexing
      if (!forceReindex) {
        const existingChunks = this.queries.getChunkByHash(fileHash);
        if (existingChunks) {
          return { path: relativePath, chunks_created: 0, skipped: true };
        }
      }

      // Delete existing chunks for this file
      this.queries.deleteChunksForPath(relativePath);

      // Chunk the content
      const chunks = this.chunker.chunkMarkdown(content);

      if (chunks.length === 0) {
        return { path: relativePath, chunks_created: 0, skipped: true };
      }

      // Generate embeddings and store chunks
      for (const chunk of chunks) {
        const chunkHash = this.generateHash(chunk.text);
        const embedding = await this.embedder.embed(chunk.text);

        const chunkData: Omit<Chunk, 'id'> = {
          path: relativePath,
          start_line: chunk.start_line,
          end_line: chunk.end_line,
          text: chunk.text,
          hash: chunkHash,
        };

        this.queries.insertChunkWithEmbedding(chunkData, embedding);
      }

      return { path: relativePath, chunks_created: chunks.length, skipped: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { path: relativePath, chunks_created: 0, skipped: true };
      }
      return { path: relativePath, chunks_created: 0, skipped: false, error: message };
    }
  }

  async indexDailyLogs(): Promise<IndexResult[]> {
    const memoryDir = join(this.projectRoot, 'memory');
    const results: IndexResult[] = [];

    try {
      const files = await readdir(memoryDir);
      const mdFiles = files.filter((f) => f.endsWith('.md'));

      for (const file of mdFiles) {
        const result = await this.indexFile(join('memory', file));
        results.push(result);
      }
    } catch {
      // Memory directory doesn't exist yet
    }

    return results;
  }

  async indexAll(forceReindex: boolean = false): Promise<{
    files: IndexResult[];
    summary: { total: number; created: number; skipped: number; errors: number };
  }> {
    // Check Ollama is available
    const healthy = await this.embedder.healthCheck();
    if (!healthy) {
      throw new Error('Ollama is not available. Run: ollama pull nomic-embed-text');
    }

    const results: IndexResult[] = [];

    // Index main memory files
    for (const file of MEMORY_FILES) {
      const result = await this.indexFile(file, forceReindex);
      results.push(result);
    }

    // Index daily logs
    const dailyResults = await this.indexDailyLogs();
    results.push(...dailyResults);

    const summary = {
      total: results.length,
      created: results.reduce((a, r) => a + r.chunks_created, 0),
      skipped: results.filter((r) => r.skipped).length,
      errors: results.filter((r) => r.error).length,
    };

    return { files: results, summary };
  }

  async getQueryEmbedding(query: string): Promise<Float32Array> {
    const tempEmbedder = new OllamaEmbedder();
    return tempEmbedder.embed(query);
  }

  dispose(): void {
    this.chunker.free();
  }
}

export function createIndexer(queries: MemoryQueries, projectRoot: string): MemoryIndexer {
  return new MemoryIndexer(queries, projectRoot);
}
