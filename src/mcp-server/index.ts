#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'path';
import { initializeDatabase, getDatabase } from '../db/schema.js';
import { MemoryQueries } from '../db/queries.js';
import { OllamaEmbedder } from '../indexer/embedder.js';
import { memorySearchSchema, memorySearch } from './tools/memory-search.js';
import { memoryGetSchema, memoryGet, memoryListSchema, memoryList } from './tools/memory-get.js';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const DB_PATH = process.env.DB_PATH || resolve(PROJECT_ROOT, 'mydatabase.db');

let db: ReturnType<typeof getDatabase>;
let queries: MemoryQueries;
let embedder: OllamaEmbedder;

function initializeServices() {
  try {
    db = getDatabase(DB_PATH);
    queries = new MemoryQueries(db);
  } catch {
    db = initializeDatabase(DB_PATH);
    queries = new MemoryQueries(db);
  }
  embedder = new OllamaEmbedder();
}

const server = new Server(
  { name: 'clawdbot-memory', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'memory_search',
      description: 'Semantically search MEMORY.md, SOUL.md, USER.md, AGENTS.md, TOOLS.md and memory/*.md daily logs',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Semantic search query' },
          maxResults: { type: 'number', description: 'Max results (default 6)', default: 6 },
          minScore: { type: 'number', description: 'Min score threshold (default 0.35)', default: 0.35 },
        },
        required: ['query'],
      },
    },
    {
      name: 'memory_get',
      description: 'Read specific content from a memory file after memory_search',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to file (e.g., "MEMORY.md" or "memory/2024-01-15.md")' },
          from: { type: 'number', description: 'Start line number (1-indexed)' },
          lines: { type: 'number', description: 'Number of lines to return (default 50)', default: 50 },
        },
        required: ['path'],
      },
    },
    {
      name: 'memory_list',
      description: 'List available memory files',
      inputSchema: {
        type: 'object',
        properties: {
          include_daily: { type: 'boolean', description: 'Include daily log files (default true)', default: true },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'memory_search': {
        const input = memorySearchSchema.parse(args);
        const result = await memorySearch(input, queries, embedder);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'memory_get': {
        const input = memoryGetSchema.parse(args);
        const result = await memoryGet(input, PROJECT_ROOT);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'memory_list': {
        const input = memoryListSchema.parse(args);
        const result = await memoryList(input, PROJECT_ROOT);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
});

async function main() {
  initializeServices();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on('SIGINT', () => { db?.close(); process.exit(0); });
  process.on('SIGTERM', () => { db?.close(); process.exit(0); });
}

main().catch((error) => { console.error('Server error:', error); process.exit(1); });
