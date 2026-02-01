# Tools

Guidance for using tools effectively in this workspace.

## Memory Tools

### memory_search
Search across all memory files using semantic + keyword hybrid search.

```json
{
  "query": "What did we decide about authentication?",
  "maxResults": 6,
  "minScore": 0.35
}
```

Returns matching chunks with file path, line numbers, and relevance score.

### memory_get
Read specific content from a memory file (use after memory_search).

```json
{
  "path": "memory/2024-01-15.md",
  "from": 45,
  "lines": 15
}
```

### memory_list
List all available memory files.

```json
{
  "include_daily": true
}
```

## Writing to Memory

Use standard file write/edit operations:
- Daily notes → `memory/YYYY-MM-DD.md`
- Long-term facts → `MEMORY.md`
- User preferences → `USER.md`
- Behavior adjustments → `SOUL.md` or `AGENTS.md`

## Tool Usage Patterns

### Research Pattern
1. `memory_search` - find relevant context
2. `memory_get` - read full content around matches
3. Synthesize information

### Save Pattern
1. Determine appropriate file based on content type
2. Use edit/write to update the file
3. Re-index if needed (`npm run index`)
