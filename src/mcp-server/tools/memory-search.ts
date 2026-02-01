import { z } from 'zod';
import { MemoryQueries, SearchResult } from '../../db/queries.js';
import { OllamaEmbedder } from '../../indexer/embedder.js';

// memory_search - matching reference API
export const memorySearchSchema = z.object({
  query: z.string().describe('Semantic search query'),
  maxResults: z.number().min(1).max(20).default(6).describe('Maximum results to return'),
  minScore: z.number().min(0).max(1).default(0.35).describe('Minimum score threshold'),
});

export type MemorySearchInput = z.infer<typeof memorySearchSchema>;

export interface MemorySearchResult {
  results: Array<{
    path: string;
    start_line: number;
    end_line: number;
    text: string;
    score: number;
  }>;
  query: string;
  total: number;
}

export async function memorySearch(
  input: MemorySearchInput,
  queries: MemoryQueries,
  embedder: OllamaEmbedder
): Promise<MemorySearchResult> {
  const { query, maxResults, minScore } = input;

  // Get query embedding
  const queryEmbedding = await embedder.embed(query);

  // Hybrid search with 70/30 weighting
  const results = queries.hybridSearch(queryEmbedding, query, maxResults, minScore);

  return {
    results: results.map((r) => ({
      path: r.path,
      start_line: r.start_line,
      end_line: r.end_line,
      text: r.text,
      score: Math.round(r.score * 1000) / 1000,
    })),
    query,
    total: results.length,
  };
}
