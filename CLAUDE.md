# Clawdbot Memory System

This project has persistent memory. **Use it.**

## Before Starting Any Task
1. Run `memory_search` to find relevant context
2. Check if USER.md has preferences that apply
3. Look for past decisions in MEMORY.md

## Save to Memory IMMEDIATELY When:
- User makes a decision → Save to `MEMORY.md` NOW
- User states a preference → Save to `USER.md` NOW
- Direction changes or pivots → Save to `MEMORY.md` NOW
- You learn something about the user → Save to `USER.md` NOW

**Don't wait until "work is complete" - save decisions as they happen.**

After completing a task, also add session notes to `memory/YYYY-MM-DD.md`.

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

## What to Save (and Where)

**MEMORY.md (save immediately when these happen):**
- "Let's go with X instead of Y" → Save the decision and why
- "We're switching to..." → Save the change of direction
- Architecture or tech stack choices
- Important facts about the project

**USER.md (save immediately when you notice):**
- "I prefer X" → Save it NOW
- "I don't like Y" → Save it NOW
- "I always use Z" → Save it NOW
- Any workflow or style preference

**memory/YYYY-MM-DD.md (daily log):**
- Session summaries
- Work in progress notes
- Temporary debugging info

**Don't save:**
- Trivial implementation details that are obvious from code
- Things already documented elsewhere
