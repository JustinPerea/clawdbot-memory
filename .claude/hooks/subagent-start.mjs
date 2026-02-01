#!/usr/bin/env node

/**
 * Subagent Start Hook
 *
 * NOTE: As of Jan 2026, Claude Code's SubagentStart hook does NOT support
 * additionalContext injection. This hook currently only works for
 * logging/monitoring purposes.
 *
 * Subagents should use MCP tools (memory_search, memory_get) directly.
 *
 * Plain Node.js - no tsx required
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

async function getMemoryContent(file, maxLines = 20) {
  try {
    const content = await readFile(join(PROJECT_ROOT, file), 'utf-8');
    const lines = content.split('\n').slice(0, maxLines).join('\n');
    return lines.slice(0, 500);
  } catch {
    return null;
  }
}

async function main() {
  const contextParts = [];

  const files = [
    { name: 'USER.md', desc: 'User preferences' },
    { name: 'MEMORY.md', desc: 'Project knowledge' },
    { name: 'AGENTS.md', desc: 'Behavior guidelines' },
  ];

  for (const file of files) {
    const content = await getMemoryContent(file.name);
    if (content) {
      contextParts.push(`**${file.name}** (${file.desc}):\n${content}`);
    }
  }

  if (contextParts.length > 0) {
    const additionalContext = [
      '## Subagent Memory Context',
      '',
      'You have access to the project memory system. Key context:',
      '',
      ...contextParts,
      '',
      '---',
      'Use `memory_search` if you need more context.',
      'Report important findings back to the main session.',
    ].join('\n');

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext
      }
    }));
  } else {
    console.log(JSON.stringify({}));
  }
}

main().catch(() => console.log(JSON.stringify({})));
