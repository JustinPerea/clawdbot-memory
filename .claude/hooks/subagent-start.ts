#!/usr/bin/env npx tsx

/**
 * Subagent Start Hook
 *
 * NOTE: As of Jan 2026, Claude Code's SubagentStart hook does NOT support
 * additionalContext injection (only SessionStart, PreToolUse, PostToolUse,
 * UserPromptSubmit, and Setup support this). This hook currently only
 * works for logging/monitoring purposes.
 *
 * Subagents should use MCP tools (memory_search, memory_get) directly
 * to access memory context.
 *
 * This file is kept ready for when SubagentStart adds additionalContext support.
 */

import { readFile, appendFile } from 'fs/promises';
import { join } from 'path';

// Log to file to verify hook is triggered
const logFile = '/tmp/subagent-hook-debug.log';
await appendFile(logFile, `[${new Date().toISOString()}] SubagentStart hook triggered\n`);

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

async function getMemoryContent(file: string, maxLines: number = 20): Promise<string | null> {
  try {
    const content = await readFile(join(PROJECT_ROOT, file), 'utf-8');
    const lines = content.split('\n').slice(0, maxLines).join('\n');
    return lines.slice(0, 500);
  } catch {
    return null;
  }
}

async function main() {
  const contextParts: string[] = [];

  // Get key memory files for subagent context
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

    // Use hookSpecificOutput format like SessionStart
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

main();
