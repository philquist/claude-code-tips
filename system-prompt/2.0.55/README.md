# v2.0.55 - Archived

This version is no longer maintained. See [2.0.56](../2.0.56/) for the current patches.

## Measured Results (v2.0.55)

These measurements were taken from v2.0.55. Results are similar in newer versions.

### Extracted Prompt Size

From comparing `extract-system-prompt.js` output before and after patching:

- **Original**: 830 lines, 52,590 chars
- **After 33 patches**: ~23,200 chars (static template)
- **Savings**: ~29KB (~56% reduction in static content)

### Token Savings

From `/context` command in Claude Code (shows actual runtime token counts):

| Component | Unpatched | Patched | Savings |
|-----------|-----------|---------|---------|
| System prompt | 3.0k | 2.4k | 600 tokens |
| System tools | 14.6k | 8.1k | 6,500 tokens |
| Other | ~0.4k | ~0.4k | 0 |
| **Static total** | **~18k** | **~11k** | **~7,100 tokens (39%)** |
| Allowed tools list | ~2.5-3.5k | 0 | ~3,000 tokens |
| **Total (with allowed tools)** | **~21k** | **~11k** | **~10,000 tokens (48%)** |

The allowed tools row is estimated from Claude's self-reported token count when asked to analyze the list. This varies by project - with 70+ approved commands, the list was ~8,000-10,000 characters (~2,500-3,500 tokens).

### Before/After Screenshots

| Unpatched | Patched |
|-----------|---------|
| ![Unpatched context usage](context-unpatched.png) | ![Patched context usage](context-patched.png) |
