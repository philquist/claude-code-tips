# Created a GitHub repo with 40 Claude Code tips and received 100+ stars - thank you

I shared [this repo](https://github.com/ykdojo/claude-code-tips) a few times here and I was worried people might think I'm being spammy but luckily it seems like you guys liked it so I really appreciate your support.

Here are a few tips from the list in case you're curious:

* **Tip 7: Proactive context management** - Instead of waiting for auto-compaction, I instruct Claude Code to write a HANDOFF.md before starting fresh. It captures what worked, what didn't, and next steps so the new conversation can pick up right where I left off.
* **Tip 14: Slim down the system prompt** - Claude Code's system prompt and tools take up ~18k tokens before you even start. I created patches that cut this to ~10k, saving about 41% of the static overhead.
* **Tip 20: Containers for risky tasks** - Running Claude Code with `--dangerously-skip-permissions` is the equivalent of having unprotected sex. So use a condo... I mean a container.
