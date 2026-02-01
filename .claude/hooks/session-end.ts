#!/usr/bin/env npx tsx

/**
 * Session End Hook
 * Triggers re-indexing of memory files when a session ends.
 */

import { resolve } from 'path';
import { initializeDatabase } from '../../src/db/schema.js';
import { MemoryQueries } from '../../src/db/queries.js';
import { createIndexer } from '../../src/indexer/indexer.js';

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_ROOT || process.cwd();
const DB_PATH = resolve(PROJECT_ROOT, 'mydatabase.db');

async function main() {
  try {
    // Re-index memory files to capture any changes from this session
    const db = initializeDatabase(DB_PATH);
    const queries = new MemoryQueries(db);
    const indexer = createIndexer(queries, PROJECT_ROOT);

    const result = await indexer.indexAll(false); // Don't force, only index changes

    indexer.dispose();
    db.close();

    console.log(JSON.stringify({
      indexed: true,
      chunks_created: result.summary.created,
      files_processed: result.summary.total - result.summary.skipped
    }));
  } catch (error) {
    // Silently fail - don't block session end
    console.log(JSON.stringify({ indexed: false, error: String(error) }));
  }
}

main();
