#!/usr/bin/env node

/**
 * Session End Hook
 *
 * Note: Re-indexing is handled separately via `pnpm run index`.
 * This hook is lightweight to avoid blocking session end.
 *
 * Plain Node.js - no tsx required
 */

import { appendFile } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

async function main() {
  try {
    // Log session end to daily file
    const today = new Date().toISOString().split('T')[0];
    const logFile = join(PROJECT_ROOT, 'memory', `${today}.md`);
    const timestamp = new Date().toLocaleTimeString();

    await appendFile(logFile, `\n---\n_Session ended at ${timestamp}_\n`);

    console.log(JSON.stringify({ logged: true }));
  } catch {
    // Silently succeed - don't block session end
    console.log(JSON.stringify({}));
  }
}

main().catch(() => console.log(JSON.stringify({})));
