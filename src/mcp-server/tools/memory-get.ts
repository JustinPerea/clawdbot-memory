import { z } from 'zod';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';

// memory_get - line-based retrieval matching reference
export const memoryGetSchema = z.object({
  path: z.string().describe('Path to the memory file (e.g., "MEMORY.md" or "memory/2024-01-15.md")'),
  from: z.number().min(1).optional().describe('Start line number (1-indexed)'),
  lines: z.number().min(1).default(50).describe('Number of lines to return (default 50)'),
});

export type MemoryGetInput = z.infer<typeof memoryGetSchema>;

export interface MemoryGetResult {
  content: string;
  path: string;
  from_line: number;
  to_line: number;
  total_lines: number;
  exists: boolean;
  error?: string;
}

// memory_list - list available memory files
export const memoryListSchema = z.object({
  include_daily: z.boolean().default(true).describe('Include daily log files'),
});

export type MemoryListInput = z.infer<typeof memoryListSchema>;

export interface MemoryListResult {
  files: Array<{
    path: string;
    size: number;
    type: 'curated' | 'daily';
  }>;
}

// Valid memory files
const MEMORY_FILES = ['MEMORY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md'];

export async function memoryGet(input: MemoryGetInput, projectRoot: string): Promise<MemoryGetResult> {
  const { path: filePath, from, lines } = input;

  // Validate path is a memory file
  const normalizedPath = filePath.startsWith('/') ? filePath : join(projectRoot, filePath);
  const resolvedPath = resolve(normalizedPath);
  const resolvedRoot = resolve(projectRoot);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    return { content: '', path: filePath, from_line: 0, to_line: 0, total_lines: 0, exists: false, error: 'Path outside project root' };
  }

  const relativePath = resolvedPath.replace(resolvedRoot + '/', '');
  const isValidMemoryFile = MEMORY_FILES.includes(relativePath) ||
    (relativePath.startsWith('memory/') && relativePath.endsWith('.md'));

  if (!isValidMemoryFile) {
    return { content: '', path: filePath, from_line: 0, to_line: 0, total_lines: 0, exists: false, error: 'Not a valid memory file' };
  }

  try {
    const content = await readFile(resolvedPath, 'utf-8');
    const allLines = content.split('\n');
    const totalLines = allLines.length;

    const startLine = from ?? 1;
    const endLine = Math.min(startLine + lines - 1, totalLines);

    const selectedLines = allLines.slice(startLine - 1, endLine);

    return {
      content: selectedLines.join('\n'),
      path: relativePath,
      from_line: startLine,
      to_line: endLine,
      total_lines: totalLines,
      exists: true,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { content: '', path: filePath, from_line: 0, to_line: 0, total_lines: 0, exists: false, error: 'File not found' };
    }
    throw error;
  }
}

export async function memoryList(input: MemoryListInput, projectRoot: string): Promise<MemoryListResult> {
  const files: MemoryListResult['files'] = [];

  // Check main memory files
  for (const file of MEMORY_FILES) {
    try {
      const filePath = join(projectRoot, file);
      const stats = await stat(filePath);
      files.push({ path: file, size: stats.size, type: 'curated' });
    } catch {
      // File doesn't exist
    }
  }

  // Check daily logs
  if (input.include_daily) {
    try {
      const memoryDir = join(projectRoot, 'memory');
      const entries = await readdir(memoryDir);

      for (const entry of entries) {
        if (/^\d{4}-\d{2}-\d{2}\.md$/.test(entry)) {
          try {
            const filePath = join(memoryDir, entry);
            const stats = await stat(filePath);
            files.push({ path: `memory/${entry}`, size: stats.size, type: 'daily' });
          } catch {
            // Skip unreadable files
          }
        }
      }

      // Sort daily files by date (newest first)
      files.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'curated' ? -1 : 1;
        return b.path.localeCompare(a.path);
      });
    } catch {
      // Memory directory doesn't exist
    }
  }

  return { files };
}
