#!/usr/bin/env npx tsx

/**
 * Test script for memory tools
 */

import { resolve } from 'path';
import { initializeDatabase } from './db/schema.js';
import { MemoryQueries } from './db/queries.js';
import { memoryList, memoryGet } from './mcp-server/tools/memory-get.js';
import { memorySearch } from './mcp-server/tools/memory-search.js';
import { OllamaEmbedder } from './indexer/embedder.js';

const PROJECT_ROOT = process.cwd();
const DB_PATH = resolve(PROJECT_ROOT, 'mydatabase.db');

async function main() {
  console.log('Testing Memory Tools\n');
  console.log(`Database: ${DB_PATH}`);
  console.log(`Project: ${PROJECT_ROOT}\n`);

  const db = initializeDatabase(DB_PATH);
  const queries = new MemoryQueries(db);
  const embedder = new OllamaEmbedder();

  // Check Ollama health first
  const ollamaHealthy = await embedder.healthCheck();
  if (!ollamaHealthy) {
    console.log('⚠ Ollama not available - run: ollama pull nomic-embed-text');
    console.log('Skipping semantic search tests.\n');
  }

  // Test 1: memory_list
  console.log('=== Test: memory_list ===');
  try {
    const listResult = await memoryList({ include_daily: true }, PROJECT_ROOT);
    console.log('Memory files:');
    for (const file of listResult.files) {
      console.log(`  ${file.path} (${file.size} bytes, type: ${file.type})`);
    }
    console.log('✓ memory_list passed\n');
  } catch (error) {
    console.error('✗ memory_list failed:', error);
  }

  // Test 2: memory_get
  console.log('=== Test: memory_get ===');
  try {
    const getResult = await memoryGet({ path: 'USER.md', lines: 15 }, PROJECT_ROOT);
    console.log(`Content from USER.md (lines 1-15):\n---`);
    console.log(getResult.content.slice(0, 300) + (getResult.content.length > 300 ? '...' : ''));
    console.log('---');
    console.log('✓ memory_get passed\n');
  } catch (error) {
    console.error('✗ memory_get failed:', error);
  }

  // Test 3: memory_search (if Ollama available)
  if (ollamaHealthy) {
    console.log('=== Test: memory_search ===');
    try {
      const searchResult = await memorySearch(
        { query: 'user preferences', maxResults: 5 },
        queries,
        embedder
      );
      console.log(`Search results for "user preferences":`);
      for (const result of searchResult.results) {
        console.log(`  [${result.score.toFixed(2)}] ${result.path}:${result.start_line}-${result.end_line}`);
        console.log(`    "${result.text.slice(0, 80)}..."`);
      }
      console.log('✓ memory_search passed\n');
    } catch (error) {
      console.error('✗ memory_search failed:', error);
    }
  }

  // Test 4: text-only search
  console.log('=== Test: text search (FTS5) ===');
  try {
    const textResults = queries.textSearch('memory');
    console.log(`FTS5 results for "memory":`);
    for (const result of textResults.slice(0, 3)) {
      console.log(`  ${result.path}:${result.start_line} - "${result.text.slice(0, 60)}..."`);
    }
    console.log('✓ text search passed\n');
  } catch (error) {
    console.error('✗ text search failed:', error);
  }

  db.close();
  console.log('All tests complete!');
}

main().catch(console.error);
