#!/usr/bin/env node

import { initializeDatabase } from '../db/schema.js';
import { MemoryQueries } from '../db/queries.js';
import { createIndexer } from './indexer.js';
import { resolve } from 'path';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const DB_PATH = process.env.DB_PATH || resolve(PROJECT_ROOT, 'mydatabase.db');

async function main() {
  const args = process.argv.slice(2);
  const forceReindex = args.includes('--force') || args.includes('-f');

  console.log('Clawdbot Memory Indexer');
  console.log('=======================');
  console.log(`Project: ${PROJECT_ROOT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Force: ${forceReindex}`);
  console.log('');

  const db = initializeDatabase(DB_PATH);
  const queries = new MemoryQueries(db);
  const indexer = createIndexer(queries, PROJECT_ROOT);

  try {
    console.log('Indexing memory files...\n');
    const results = await indexer.indexAll(forceReindex);

    for (const file of results.files) {
      if (file.error) {
        console.log(`  ${file.path}: ERROR - ${file.error}`);
      } else if (file.skipped) {
        console.log(`  ${file.path}: skipped (no changes)`);
      } else {
        console.log(`  ${file.path}: ${file.chunks_created} chunks`);
      }
    }

    console.log('\nSummary:');
    console.log(`  Files: ${results.summary.total}`);
    console.log(`  Chunks created: ${results.summary.created}`);
    console.log(`  Skipped: ${results.summary.skipped}`);
    console.log(`  Errors: ${results.summary.errors}`);
  } catch (error) {
    console.error('Indexing failed:', error);
    process.exit(1);
  } finally {
    indexer.dispose();
    db.close();
  }
}

main().catch(console.error);
