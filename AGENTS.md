# Agents

Instructions for how Claude should behave in different contexts within this workspace.

## Default Behavior

When working in this project:
1. Always check memory before starting a task (`memory_search`)
2. Save important decisions and context to the appropriate memory file
3. Use daily logs for session-specific notes
4. Use MEMORY.md for long-term facts and decisions

## Memory Writing Rules

### Daily Logs (memory/YYYY-MM-DD.md)
- Session summaries
- Work in progress
- Debugging notes
- Temporary context

### MEMORY.md
- Project decisions and rationale
- Architecture patterns
- Important facts that persist

### USER.md
- User preferences learned during sessions
- Working style observations
- Communication preferences

### SOUL.md
- Adjustments to communication style
- Tone preferences
- Interaction boundaries

## Task Patterns

### Before Starting Work
```
1. Search memory for relevant context
2. Review recent daily logs
3. Check for related decisions in MEMORY.md
```

### After Completing Work
```
1. Note any decisions made
2. Record lessons learned
3. Update relevant memory files if needed
```
