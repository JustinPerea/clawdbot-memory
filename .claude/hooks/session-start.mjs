#!/usr/bin/env node

/**
 * Session Start Hook
 * Injects memory context at the start of a Claude Code session
 *
 * Plain Node.js - no tsx required
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

async function getRecentDailyLogs(days = 3) {
  const memoryDir = join(PROJECT_ROOT, 'memory');
  try {
    const files = await readdir(memoryDir);
    const mdFiles = files
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse()
      .slice(0, days);

    const contents = [];
    for (const file of mdFiles) {
      try {
        const content = await readFile(join(memoryDir, file), 'utf-8');
        if (content.trim()) {
          contents.push(`### ${file.replace('.md', '')}\n${content.slice(0, 500)}`);
        }
      } catch { /* skip */ }
    }
    return contents;
  } catch {
    return [];
  }
}

async function getMemorySummary(file) {
  try {
    const content = await readFile(join(PROJECT_ROOT, file), 'utf-8');
    const lines = content.split('\n').slice(0, 10).join('\n');
    return lines.slice(0, 300);
  } catch {
    return null;
  }
}

async function main() {
  const contextParts = [];

  // Get summaries from curated files
  const files = ['MEMORY.md', 'USER.md', 'SOUL.md'];
  for (const file of files) {
    const summary = await getMemorySummary(file);
    if (summary) {
      contextParts.push(`**${file}:**\n${summary}`);
    }
  }

  // Get recent daily logs
  const dailyLogs = await getRecentDailyLogs(3);
  if (dailyLogs.length > 0) {
    contextParts.push(`**Recent Sessions:**\n${dailyLogs.join('\n\n')}`);
  }

  if (contextParts.length > 0) {
    const additionalContext = [
      '## Memory Context',
      '',
      ...contextParts,
      '',
      '---',
      'Use `memory_search` for detailed memory retrieval.',
      'Save important info to memory files using standard edit/write.',
    ].join('\n');

    console.log(JSON.stringify({ additionalContext }));
  } else {
    console.log(JSON.stringify({}));
  }
}

main().catch(() => console.log(JSON.stringify({})));
