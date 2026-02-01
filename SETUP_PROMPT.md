# Setup Prompt

Copy everything below and paste it to Claude Code in your project directory.

---

## Prompt

I want to add persistent memory to this project using the clawdbot-memory system. Please set it up for me.

**Repository:** https://github.com/JustinPerea/clawdbot-memory

### What to do:

1. **Copy the memory system files** from the repo into this project:
   - `src/` directory (MCP server and indexer)
   - `.mcp.json` (MCP configuration)
   - `.claude/hooks/` (session lifecycle hooks)
   - `.claude/settings.template.json`
   - `CLAUDE.md`, `MEMORY.md`, `USER.md`, `SOUL.md`, `AGENTS.md`, `TOOLS.md`
   - `tsconfig.json`
   - Create empty `memory/` directory for daily logs

2. **Merge dependencies** into my existing `package.json` (or create one if needed):
   ```json
   {
     "dependencies": {
       "@modelcontextprotocol/sdk": "^1.25.3",
       "better-sqlite3": "^12.6.2",
       "sqlite-vec": "^0.1.7-alpha.2",
       "tiktoken": "^1.0.22",
       "zod": "^4.3.6"
     },
     "devDependencies": {
       "@types/better-sqlite3": "^7.6.13",
       "@types/node": "^25.1.0",
       "tsx": "^4.21.0",
       "typescript": "^5.9.3"
     },
     "scripts": {
       "memory:build": "tsc -p tsconfig.memory.json",
       "memory:index": "tsx src/memory/indexer/cli.ts",
       "memory:dev": "tsx watch src/memory/mcp-server/index.ts"
     }
   }
   ```

3. **Set up settings**:
   - Copy `.claude/settings.template.json` to `.claude/settings.local.json`
   - Add `.claude/settings.local.json` to `.gitignore`

4. **Customize the memory files** for this project:
   - Update `USER.md` with my name and any preferences you've learned
   - Update `MEMORY.md` with any project context we've discussed
   - Update `CLAUDE.md` if there are project-specific instructions

5. **Install and build**:
   ```bash
   pnpm install
   pnpm run memory:build
   pnpm run memory:index
   ```

6. **Verify it works** by restarting Claude Code and testing `memory_search`

### Requirements:
- Ollama must be installed with `nomic-embed-text` model (`ollama pull nomic-embed-text`)
- Node.js 18+ and pnpm

### Notes:
- Don't overwrite my existing project files
- Put memory system source files in `src/memory/` to keep them separate
- Adapt paths in `.mcp.json` and hooks if needed for my project structure
