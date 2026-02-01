import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

const EMBEDDING_DIMENSIONS = 768; // nomic-embed-text dimensions

export function initializeDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  // Load sqlite-vec extension
  sqliteVec.load(db);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create chunks table - simplified schema matching reference
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY,
      path TEXT NOT NULL,
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      text TEXT NOT NULL,
      hash TEXT NOT NULL UNIQUE
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_path ON chunks(path);
    CREATE INDEX IF NOT EXISTS idx_chunks_hash ON chunks(hash);
  `);

  // FTS5 for full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      text,
      content='chunks',
      content_rowid='id'
    );
  `);

  // Triggers to keep FTS5 in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES ('delete', old.id, old.text);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES ('delete', old.id, old.text);
      INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
    END;
  `);

  // sqlite-vec for vector search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
      embedding float[${EMBEDDING_DIMENSIONS}]
    );
  `);

  // Mapping table for vec0 rowids to chunk ids
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks_vec_map (
      vec_rowid INTEGER PRIMARY KEY,
      chunk_id INTEGER NOT NULL,
      FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
    );
  `);

  // Embedding cache to avoid re-embedding unchanged content
  db.exec(`
    CREATE TABLE IF NOT EXISTS embedding_cache (
      hash TEXT PRIMARY KEY,
      embedding BLOB NOT NULL
    );
  `);

  return db;
}

export function getDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  sqliteVec.load(db);
  return db;
}

export { EMBEDDING_DIMENSIONS };
