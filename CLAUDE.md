# Clawdbot Memory System

This project has persistent memory. **Use it.**

## Before Starting Any Task
1. Run `memory_search` to find relevant context
2. Check if USER.md has preferences that apply
3. Look for past decisions in MEMORY.md

## After Completing Work
1. Save important decisions to `MEMORY.md`
2. Save learned user preferences to `USER.md`
3. For session-specific notes, use `memory/YYYY-MM-DD.md`

## MCP Tools Available

| Tool | Use For |
|------|---------|
| `memory_search` | Find relevant memories by semantic search |
| `memory_get` | Read specific lines from a memory file |
| `memory_list` | List all memory files |

### Quick Examples
```json
// Search for context
{"query": "user preferences for testing", "maxResults": 6}

// Read specific content
{"path": "USER.md", "from": 1, "lines": 30}
```

## Memory Files

| File | What to Store |
|------|---------------|
| `MEMORY.md` | Project decisions, architecture, persistent facts |
| `USER.md` | User preferences, coding style, tool choices |
| `SOUL.md` | Communication style, tone adjustments |
| `AGENTS.md` | Detailed behavior patterns (read when needed) |
| `TOOLS.md` | Tool usage guidance (read when needed) |
| `memory/*.md` | Daily session logs, temporary notes |

## Key User Info (Quick Reference)

Check USER.md for current preferences, but known facts:
- See `memory_search` for the latest user preferences
- Always respect preferences for: editor, testing framework, code style

## When to Save to Memory

**Save to MEMORY.md:**
- Technical decisions and rationale
- Project architecture choices
- Important facts that should persist

**Save to USER.md:**
- New preferences you learn ("I prefer X over Y")
- Working style observations
- Tool/framework preferences

**Don't save:**
- Trivial implementation details
- Temporary debugging info (use daily logs instead)
