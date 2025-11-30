# System Prompt Extraction

Extracts the system prompt from the Claude Code CLI bundle.

## Files

- `extract-system-prompt.js` - Node.js script to extract the prompt
- `system-prompt.txt` - Extracted system prompt (~31KB)

## Results

Extracted content includes:
- Identity and security guidelines
- Tone and style instructions
- Professional objectivity guidelines
- Task management with examples
- Doing tasks guidelines (with over-engineering warnings)
- Tool usage policy
- Git commit guidelines
- Pull request guidelines
- Code references
- All tool descriptions (Bash, Read, Write, Edit, Glob, Grep, Task, etc.)

## How it works

Claude Code is installed at `~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js` as a ~10MB minified JavaScript bundle.

The system prompt is:
- Built dynamically from template literals
- Split across multiple sections with JavaScript conditionals
- Uses minified variable names (e.g., `E9` for "Bash", `R8` for "Task")

The extraction script:
1. Finds each major section by its header (e.g., "# Tone and style")
2. Handles conditional template patterns like `${W.has(X)?`...`:""}`
3. Extracts content across function boundaries
4. Replaces minified variable names with readable ones
5. Resolves known numeric values (timeouts, limits)

## Usage

```bash
node extract-system-prompt.js [output-file]
```

## What's NOT captured

Dynamic content injected at runtime:
- Environment info (working directory, platform, date)
- Git status snapshot
- Model info ("You are powered by...")
- Allowed tools list (tools that don't need approval)
- CLAUDE.md file contents
- MCP server instructions
- Custom output styles

For complete runtime prompt, either:
1. Ask Claude to output its own system prompt
2. Intercept the API call with a proxy (e.g., mitmproxy)
3. Use Node debugger to inspect at runtime

## Variable mappings (v2.0.55)

These change with each minified build:

| Minified | Actual |
|----------|--------|
| E9 | Bash |
| R8 | Task |
| eI.name | TodoWrite |
| h5 | Read |
| R5 | Edit |
| vX | Write |
| xX | WebFetch |
| DD | Glob |
| uY | Grep |
| uJ | AskUserQuestion |
| ZC.agentType | Explore |
| uzA | 2000 (line limit) |
| kj9 | 600000 (10 min timeout) |
