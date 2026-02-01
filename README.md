# Clawdbot Memory

A persistent memory system for Claude Code that gives Claude long-term memory across sessions.

## Features

- **Semantic search** - Find relevant memories using natural language queries
- **Hybrid search** - Combines vector embeddings with keyword matching
- **Structured memory files** - Organized storage for different types of information
- **Session hooks** - Automatically loads context at session start
- **Local-first** - All data stays on your machine in SQLite

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/JustinPerea/clawdbot-memory.git
cd clawdbot-memory
pnpm install
```

### 2. Set up Ollama (for embeddings)

```bash
# Install Ollama: https://ollama.ai
ollama pull nomic-embed-text
```

### 3. Configure Claude Code

Copy the settings template:

```bash
cp .claude/settings.template.json .claude/settings.local.json
```

### 4. Build and index

```bash
pnpm run build
pnpm run index
```

### 5. Start Claude Code

```bash
claude
```

The memory MCP server starts automatically.

## Memory Files

| File | Purpose |
|------|---------|
| `MEMORY.md` | Long-term facts, project decisions, architecture |
| `USER.md` | Your preferences, coding style, tools |
| `SOUL.md` | Communication style and tone adjustments |
| `AGENTS.md` | Behavior patterns for different contexts |
| `TOOLS.md` | Tool usage guidance |
| `CLAUDE.md` | Instructions Claude reads on startup |
| `memory/*.md` | Daily session logs |

## MCP Tools

### `memory_search`
Semantic search across all memory files.

```json
{"query": "What testing framework do we use?", "maxResults": 6}
```

### `memory_get`
Read specific lines from a memory file.

```json
{"path": "USER.md", "from": 1, "lines": 20}
```

### `memory_list`
List all available memory files.

```json
{"include_daily": true}
```

## How It Works

1. **Indexing**: `pnpm run index` chunks your markdown files and generates embeddings using Ollama's `nomic-embed-text` model
2. **Storage**: Chunks and embeddings are stored in SQLite with `sqlite-vec` for vector search
3. **Search**: Queries are embedded and matched against stored chunks using cosine similarity + keyword boost
4. **MCP Server**: Claude Code connects to the memory server via the Model Context Protocol

## Project Structure

```
clawdbot-memory/
├── src/
│   ├── mcp-server/     # MCP server implementation
│   │   ├── index.ts
│   │   └── tools/
│   ├── indexer/        # Document chunking & embedding
│   │   ├── chunker.ts
│   │   ├── embedder.ts
│   │   └── indexer.ts
│   └── db/             # SQLite + vector storage
│       ├── schema.ts
│       └── queries.ts
├── .claude/
│   ├── hooks/          # Session lifecycle hooks
│   └── settings.template.json
├── .mcp.json           # MCP server configuration
├── CLAUDE.md           # Instructions for Claude
└── *.md                # Memory files
```

## Hooks

The system includes optional hooks for session lifecycle events:

- `SessionStart` - Load context when starting Claude
- `SessionEnd` - Save session summary
- `PreCompact` - Preserve important context before summarization
- `SubagentStart` - Inject context into subagents

## Requirements

- Node.js 18+
- pnpm
- [Ollama](https://ollama.ai) with `nomic-embed-text` model
- Claude Code CLI

## License

MIT
