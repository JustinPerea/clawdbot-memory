#!/usr/bin/env npx tsx

import { initializeDatabase } from './db/schema.js';
import { MemoryQueries } from './db/queries.js';
import { createChunker } from './indexer/chunker.js';
import { OllamaEmbedder } from './indexer/embedder.js';
import { resolve } from 'path';
import { rm } from 'fs/promises';

const TEST_DB_PATH = resolve(process.cwd(), 'test-memory.db');

async function cleanup() {
  try { await rm(TEST_DB_PATH); } catch { /* ignore */ }
}

async function testDatabase() {
  console.log('Testing database...');
  const db = initializeDatabase(TEST_DB_PATH);
  const queries = new MemoryQueries(db);

  const chunkId = queries.insertChunk({
    path: 'test.md',
    start_line: 1,
    end_line: 5,
    text: 'This is test content for the memory system.',
    hash: 'abc123',
  });
  console.log(`  ✓ Inserted chunk ID: ${chunkId}`);

  const chunk = queries.getChunkByHash('abc123');
  if (!chunk) throw new Error('Failed to retrieve chunk');
  console.log(`  ✓ Retrieved chunk`);

  const textResults = queries.textSearch('memory system');
  console.log(`  ✓ FTS search: ${textResults.length} results`);

  db.close();
  console.log('  ✓ Database tests passed');
}

async function testChunker() {
  console.log('\nTesting chunker...');
  const chunker = createChunker();

  const markdown = `# Test Document

This is the first paragraph.

## Section One

More content here spanning multiple lines.
This tests the line number tracking.

## Section Two

Final section content.
`;

  const chunks = chunker.chunkMarkdown(markdown);
  console.log(`  ✓ Created ${chunks.length} chunks`);

  for (const chunk of chunks) {
    console.log(`    Lines ${chunk.start_line}-${chunk.end_line}: ${chunk.token_count} tokens`);
  }

  chunker.free();
  console.log('  ✓ Chunker tests passed');
}

async function testEmbedder() {
  console.log('\nTesting embedder...');
  const embedder = new OllamaEmbedder();

  const isHealthy = await embedder.healthCheck();
  if (!isHealthy) {
    console.log('  ⚠ Ollama not available - run: ollama pull nomic-embed-text');
    return;
  }
  console.log('  ✓ Ollama healthy');

  const embedding = await embedder.embed('Test sentence.');
  console.log(`  ✓ Embedding: ${embedding.length} dimensions`);
  console.log('  ✓ Embedder tests passed');
}

async function main() {
  console.log('Clawdbot Memory Tests\n');

  try {
    await cleanup();
    await testDatabase();
    await testChunker();
    await testEmbedder();
    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('\nTest failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();
