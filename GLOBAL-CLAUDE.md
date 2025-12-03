# Global Claude Instructions

## Safety Guidelines

**NEVER use `--dangerously-skip-permissions` on the host machine.**

For risky operations, use one of the available Docker containers instead. Inside containers, YOLO mode and `--dangerously-skip-permissions` are acceptable.

## Available Containers

| Container | Purpose | Status |
|-----------|---------|--------|
| `peaceful_lovelace` | Main container for general risky operations | Primary |
| `eager_moser` | Secondary container | Backup |
| `daphne` | Daft-related operations (our little assistant for anything Daft) | Specialized |
| `claude-history` | Specific purpose - do not use for general tasks | Reserved |

### Usage Examples

Execute commands in a container:
```bash
docker exec peaceful_lovelace <command>
```

For interactive sessions:
```bash
docker exec -it peaceful_lovelace bash
```

### When to Use Containers

- Opening or fetching unknown URLs
- Running untrusted scripts
- Operations that require elevated permissions
- Testing potentially risky code
- Any operation you wouldn't want to run directly on the host

## Tmux for Interactive Tools

When asked to run things in tmux (for interactive Gemini or Claude Code sessions):

```bash
# Create a new tmux session
tmux new-session -d -s <session-name> '<command>'

# Send commands to the session (DON'T FORGET TO PRESS ENTER)
tmux send-keys -t <session-name> '<input>' Enter

# Capture output
tmux capture-pane -t <session-name> -p
```

**Common mistake: Don't forget to include `Enter` at the end of `tmux send-keys`!**
