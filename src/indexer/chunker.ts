import { Tiktoken, encoding_for_model } from 'tiktoken';

const TARGET_CHUNK_SIZE = 400; // tokens
const CHUNK_OVERLAP = 80; // tokens

export interface ChunkResult {
  text: string;
  start_line: number;
  end_line: number;
  token_count: number;
}

export class MarkdownChunker {
  private encoder: Tiktoken;

  constructor() {
    this.encoder = encoding_for_model('gpt-4');
  }

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  // Chunk markdown content with line number tracking
  chunkMarkdown(content: string): ChunkResult[] {
    const lines = content.split('\n');
    const chunks: ChunkResult[] = [];

    let currentChunkLines: string[] = [];
    let currentChunkStart = 1;
    let currentTokenCount = 0;
    let overlapLines: string[] = [];
    let overlapTokens = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTokens = this.countTokens(line + '\n');

      // If adding this line exceeds target, save current chunk
      if (currentTokenCount + lineTokens > TARGET_CHUNK_SIZE && currentChunkLines.length > 0) {
        chunks.push({
          text: currentChunkLines.join('\n'),
          start_line: currentChunkStart,
          end_line: currentChunkStart + currentChunkLines.length - 1,
          token_count: currentTokenCount,
        });

        // Calculate overlap from end of current chunk
        overlapLines = [];
        overlapTokens = 0;
        for (let j = currentChunkLines.length - 1; j >= 0 && overlapTokens < CHUNK_OVERLAP; j--) {
          const overlapLine = currentChunkLines[j];
          const tokens = this.countTokens(overlapLine + '\n');
          if (overlapTokens + tokens <= CHUNK_OVERLAP) {
            overlapLines.unshift(overlapLine);
            overlapTokens += tokens;
          } else {
            break;
          }
        }

        // Start new chunk with overlap
        currentChunkStart = currentChunkStart + currentChunkLines.length - overlapLines.length;
        currentChunkLines = [...overlapLines];
        currentTokenCount = overlapTokens;
      }

      currentChunkLines.push(line);
      currentTokenCount += lineTokens;
    }

    // Don't forget the last chunk
    if (currentChunkLines.length > 0) {
      chunks.push({
        text: currentChunkLines.join('\n'),
        start_line: currentChunkStart,
        end_line: currentChunkStart + currentChunkLines.length - 1,
        token_count: currentTokenCount,
      });
    }

    return chunks;
  }

  free(): void {
    this.encoder.free();
  }
}

export function createChunker(): MarkdownChunker {
  return new MarkdownChunker();
}
