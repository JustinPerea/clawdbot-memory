# Setup Prompt

Copy everything below the line and paste it to Claude Code in your project directory.

---

I want to add persistent memory to this project using the clawdbot-memory system.

**Repository:** https://github.com/JustinPerea/clawdbot-memory

## Step 1: Investigate my environment first

Before doing anything, check and report:

1. **Operating system** - Are we on macOS, Linux, or Windows?

2. **Package manager** - Do I have a `package.json`? What lockfile exists (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`)? Use whatever package manager I'm already using.

3. **Existing MCP configuration** - Check for:
   - `.mcp.json` in this project directory
   - `~/.claude.json` or `~/.claude/` for user-level MCP config
   - Any existing MCP servers I'm using that we shouldn't break

4. **Existing Claude Code settings** - Check for:
   - `.claude/settings.json` or `.claude/settings.local.json`
   - Existing hooks or permissions we should preserve

5. **Project structure** - Where does source code live? (`src/`, `lib/`, root, monorepo?)

6. **Ollama availability** - Run `ollama list` to check if Ollama is installed and if `nomic-embed-text` model is available

7. **Node.js version** - Run `node --version` to confirm 18+

Report your findings and ask me to confirm before proceeding.

## Step 2: Set up the memory system

After I confirm, proceed with setup:

1. **Clone/fetch the memory system source** from the repo

2. **Place files appropriately** for my project structure:
   - Memory system source → `src/memory/` (or appropriate location)
   - Memory markdown files → project root (`MEMORY.md`, `USER.md`, etc.)
   - MCP config → merge with existing `.mcp.json` or create new
   - Claude settings → merge with existing `.claude/settings.local.json`
   - Hooks → `.claude/hooks/`

3. **Configure MCP server path** - The `.mcp.json` must use the correct path to the MCP server for my system. Use relative paths from project root.

4. **Merge dependencies** into my `package.json` (don't overwrite, merge):
   ```
   @modelcontextprotocol/sdk, better-sqlite3, sqlite-vec, tiktoken, zod
   ```
   Add scripts: `memory:build`, `memory:index`, `memory:dev`

5. **Set up .gitignore** - Add:
   ```
   .claude/settings.local.json
   memory/*.md
   *.db
   ```

6. **Customize memory files**:
   - `USER.md` - Add my name and any preferences you've learned about me
   - `MEMORY.md` - Add any project context from our conversation history
   - `CLAUDE.md` - Merge with any existing project instructions

## Step 3: Build and verify

1. Install dependencies using my package manager
2. Build the TypeScript: `<pkg-manager> run memory:build`
3. Check if Ollama is running, start if needed
4. Index memory files: `<pkg-manager> run memory:index`
5. Tell me to restart Claude Code
6. After restart, test by running `memory_search` with a query

## Important notes

- **Don't break existing MCP servers** - Merge config, don't replace
- **Don't overwrite my files** - Merge dependencies and settings
- **Use my package manager** - Don't assume pnpm
- **Handle Windows paths** - Use appropriate path separators
- **If Ollama isn't installed** - Tell me how to install it for my OS before proceeding
