# Setup Prompt

Copy everything below the line and paste it to Claude Code in your project directory.

---

I want to add persistent memory to this project using the clawdbot-memory system.

**Repository:** https://github.com/JustinPerea/clawdbot-memory

## Step 1: Investigate my environment

Before doing anything, check and report ALL of the following:

### System Information
1. **Operating system** - macOS, Linux, Windows, or WSL?
   - If WSL: note this specifically as path handling differs
   - Run `uname -a` or check environment

2. **Node.js version** - Run `node --version`
   - Must be 18+. If not installed or too old, stop and tell me how to install/upgrade for my OS

3. **Claude Code version** - Run `claude --version`
   - Note if hooks and MCP are supported in this version

### Project Structure
4. **Package manager** - Check for lockfiles:
   - `pnpm-lock.yaml` → use pnpm
   - `package-lock.json` → use npm
   - `yarn.lock` → use yarn
   - `bun.lockb` → use bun
   - None → ask me which to use

5. **Is this a Node.js project?**
   - If no `package.json` exists, this might be a Python/Go/Rust/other project
   - If non-Node: we'll create a standalone `package.json` just for the memory system
   - Ask me to confirm this approach

6. **Monorepo detection** - Check for:
   - `pnpm-workspace.yaml`
   - `lerna.json`
   - `packages/` or `apps/` directories
   - If monorepo: ask where to install (root or specific package)

7. **Source code location** - Where does code live?
   - `src/`, `lib/`, `app/`, or project root?
   - This determines where to put `src/memory/`

### Existing Configuration
8. **Existing MCP configuration** - Check ALL of these locations:
   - `.mcp.json` in project root
   - `~/.claude.json` (user-level)
   - `~/.claude/mcp.json` (user-level alternative)
   - `~/.config/claude/` (Linux XDG)
   - List any existing MCP servers - we must not break them

9. **Existing Claude Code settings** - Check for:
   - `.claude/settings.json`
   - `.claude/settings.local.json`
   - Existing hooks in `.claude/hooks/`
   - Existing permissions we should preserve

10. **Existing memory files** - Check if any of these already exist:
    - `CLAUDE.md`, `MEMORY.md`, `USER.md`, `SOUL.md`, `AGENTS.md`, `TOOLS.md`
    - `memory/` directory
    - If found: ask whether to merge, overwrite, or abort

### Build Requirements
11. **Native build tools** - `better-sqlite3` requires compilation. Check for:
    - macOS: Xcode Command Line Tools (`xcode-select -p`)
    - Linux: `build-essential` or equivalent (`which make && which g++`)
    - Windows: Check for Visual Studio Build Tools or windows-build-tools
    - If missing: tell me how to install for my OS before proceeding

12. **Python availability** - Some native modules need Python for node-gyp
    - Run `python3 --version` or `python --version`
    - If missing: warn me but continue (might work without it)

### Embedding Provider
13. **Ollama availability** - Run `ollama list`
    - If installed: check for `nomic-embed-text` model
    - If model missing: note that we need to pull it
    - If Ollama not installed: proceed to check alternatives

14. **If no Ollama** - Ask me which alternative to use:
    - **Option A**: Install Ollama (tell me how for my OS)
    - **Option B**: Use OpenAI API for embeddings (requires API key)
    - **Option C**: Use local transformers.js (no external dependencies, slower)
    - Note: Option B and C require code modifications - warn me about this

### Network/Environment
15. **Network restrictions** - Try to detect:
    - Can we reach npm? (`npm ping` or check registry)
    - Corporate proxy? Check `HTTP_PROXY`, `HTTPS_PROXY` env vars
    - If restricted: offer manual installation instructions

16. **Disk space** - Check available space in project directory
    - Need ~100MB for dependencies + embeddings database
    - Warn if low

### Memory Scope
17. **Project-specific vs shared memory** - Ask me:
    - **Option A**: Project-specific memory (default) - memory stays in this project
    - **Option B**: User-level shared memory - memory accessible across all projects
    - Explain the tradeoffs

## Step 2: Report and Confirm

Create a summary table of findings:

```
| Check | Status | Notes |
|-------|--------|-------|
| OS | ✅/⚠️/❌ | ... |
| Node.js | ✅/⚠️/❌ | ... |
| ... | ... | ... |
```

**If any critical issues (❌):** Stop and help me resolve them first.

**If warnings (⚠️):** Explain the risks and ask if I want to proceed.

**If all good (✅):** Ask for my confirmation before proceeding.

Also confirm my choices for:
- Package manager to use
- Where to put source files
- Embedding provider
- Project-specific vs shared memory
- How to handle any existing files (merge/overwrite)

## Step 3: Set up the memory system

After I confirm, proceed:

### 3.1 Fetch Source Files
- Clone or download from the repository
- Place memory system source in appropriate location (e.g., `src/memory/`)

### 3.2 Configure Package
- If non-Node project: create minimal `package.json` for memory system
- If Node project: merge dependencies (don't overwrite):
  ```
  dependencies: @modelcontextprotocol/sdk, better-sqlite3, sqlite-vec, tiktoken, zod
  devDependencies: @types/better-sqlite3, @types/node, tsx, typescript
  ```
- Add scripts with `memory:` prefix to avoid conflicts:
  - `memory:build`
  - `memory:index`
  - `memory:dev`

### 3.3 Configure MCP
- Create or merge `.mcp.json` with correct paths for this system
- Use relative paths from project root
- Preserve any existing MCP servers
- Handle path separators correctly for OS (especially Windows/WSL)

### 3.4 Configure Claude Settings
- Create or merge `.claude/settings.local.json`
- Add memory tool permissions
- Preserve existing permissions
- Set up hooks (merge with existing if any):
  - `SessionStart`
  - `SessionEnd`
  - `PreCompact`
  - `SubagentStart`

### 3.5 Set Up Memory Files
- Create memory files if they don't exist
- If they exist and user chose merge:
  - `CLAUDE.md`: Append memory system instructions to existing
  - `MEMORY.md`: Preserve existing content, add memory sections
  - `USER.md`: Preserve existing, fill in what we know
  - Others: Merge thoughtfully
- Create `memory/` directory for daily logs

### 3.6 Configure .gitignore
Add (don't replace existing):
```
# Memory system
.claude/settings.local.json
memory/*.md
*.db
```

### 3.7 Configure Embedding Provider
- If Ollama: ensure model is pulled (`ollama pull nomic-embed-text`)
- If OpenAI: prompt for API key, update embedder config
- If transformers.js: install additional dependencies

### 3.8 TypeScript Configuration
- If project has `tsconfig.json`: create separate `tsconfig.memory.json` that extends it
- If no TypeScript: create minimal `tsconfig.memory.json` for memory system only
- Avoid conflicts with existing TypeScript setup

## Step 4: Build and Verify

1. Install dependencies using detected package manager
2. If native build fails:
   - Provide specific error diagnosis
   - Suggest fixes for common issues (missing build tools, Python, etc.)
3. Build TypeScript: `<pkg-manager> run memory:build`
4. Start Ollama if needed: `ollama serve` (in background)
5. Index memory files: `<pkg-manager> run memory:index`
6. If indexing fails, diagnose and fix
7. Tell me to restart Claude Code
8. After restart, test with: `memory_search` query

## Step 5: Verify Installation

After restart, run these checks:
1. `memory_list` - Should show the memory files
2. `memory_search` with a test query - Should return results
3. `memory_get` on USER.md - Should return content

If any fail, diagnose the issue (MCP not connected, index empty, etc.)

## Important Rules

- **Never break existing setups** - Always merge, never replace
- **Ask before destructive actions** - Especially for existing files
- **Use correct paths** - Handle OS differences, especially Windows/WSL
- **Preserve existing work** - Don't overwrite user's configs or code
- **Explain issues clearly** - If something fails, explain why and how to fix
- **Offer alternatives** - If one approach won't work, suggest others
- **Respect user choices** - Don't assume package manager, embedding provider, etc.

## Troubleshooting Reference

If you encounter these issues during setup:

| Issue | Cause | Solution |
|-------|-------|----------|
| `node-gyp` build fails | Missing build tools | Install Xcode CLT (mac), build-essential (linux), or VS Build Tools (windows) |
| `better-sqlite3` fails on ARM | Architecture mismatch | Try `npm rebuild` or install from source |
| Ollama connection refused | Ollama not running | Run `ollama serve` in background |
| MCP server not found | Wrong path in .mcp.json | Check path is relative and correct for OS |
| Permission denied | File permissions | Check write access to project directory |
| Import errors after build | TypeScript config issue | Check `tsconfig.memory.json` module settings |
| Empty search results | Index not built | Run `memory:index` again |
| Hooks not firing | Settings not loaded | Restart Claude Code, check settings.local.json |
