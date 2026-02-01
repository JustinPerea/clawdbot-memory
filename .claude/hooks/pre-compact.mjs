#!/usr/bin/env node

/**
 * Pre-Compact Hook (Memory Flush)
 * Prompts Claude to save important information before context compaction.
 *
 * Plain Node.js - no tsx required
 */

const MEMORY_FLUSH_PROMPT = `
## Memory Flush Required

Session context is about to be compacted. Before this happens:

1. **Review what's been discussed** in this session
2. **Identify durable information** that should persist:
   - Decisions made and their rationale
   - User preferences discovered
   - Important facts about the project
   - Lessons learned
3. **Write to appropriate memory files:**
   - Daily notes → \`memory/YYYY-MM-DD.md\`
   - Long-term facts → \`MEMORY.md\`
   - User preferences → \`USER.md\`

If there's nothing important to save, reply with just "NO_SAVE".
Otherwise, save the relevant information now.
`;

console.log(JSON.stringify({
  additionalContext: MEMORY_FLUSH_PROMPT
}));
