import { createHash } from 'crypto';
import { EMBEDDING_DIMENSIONS } from '../db/schema.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

export interface EmbeddingCache {
  get(hash: string): Float32Array | null;
  set(hash: string, embedding: Float32Array): void;
}

export class OllamaEmbedder {
  private model: string;
  private baseUrl: string;
  private cache: EmbeddingCache | null;

  constructor(options?: { model?: string; baseUrl?: string; cache?: EmbeddingCache }) {
    this.model = options?.model || EMBEDDING_MODEL;
    this.baseUrl = options?.baseUrl || OLLAMA_BASE_URL;
    this.cache = options?.cache || null;
  }

  // Generate content hash for caching
  private hashContent(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  // Generate embedding for a single text
  async embed(text: string): Promise<Float32Array> {
    const contentHash = this.hashContent(text);

    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(contentHash);
      if (cached) {
        return cached;
      }
    }

    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama embedding failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as OllamaEmbeddingResponse;

    if (!data.embedding || data.embedding.length === 0) {
      throw new Error('Ollama returned empty embedding');
    }

    const embedding = new Float32Array(data.embedding);

    // Validate dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      console.warn(
        `Warning: Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`
      );
    }

    // Store in cache
    if (this.cache) {
      this.cache.set(contentHash, embedding);
    }

    return embedding;
  }

  // Generate embeddings for multiple texts
  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    // Ollama doesn't support batch embeddings natively, so we process sequentially
    // but could parallelize with Promise.all if needed
    const embeddings: Float32Array[] = [];

    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  // Check if Ollama is running and model is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { models: Array<{ name: string }> };
      const modelExists = data.models.some(
        (m) => m.name === this.model || m.name.startsWith(`${this.model}:`)
      );

      if (!modelExists) {
        console.warn(
          `Model ${this.model} not found. Run: ollama pull ${this.model}`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  getModel(): string {
    return this.model;
  }
}

// Create a database-backed cache
export function createDatabaseCache(db: {
  getCachedEmbedding: (hash: string) => Float32Array | null;
  setCachedEmbedding: (hash: string, embedding: Float32Array) => void;
}): EmbeddingCache {
  return {
    get(hash: string): Float32Array | null {
      return db.getCachedEmbedding(hash);
    },
    set(hash: string, embedding: Float32Array): void {
      db.setCachedEmbedding(hash, embedding);
    },
  };
}

export function createEmbedder(cache?: EmbeddingCache): OllamaEmbedder {
  return new OllamaEmbedder({ cache });
}
