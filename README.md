# personal-pi-tools

My personal [pi](https://github.com/earendil-works/pi) tools package.

## Install

```bash
pi install git:github.com/kulla/personal-pi-tools
```

## Extensions

### Bell

Rings the terminal bell when an agent run settles and Pi is ready for input.

### /luna and /sol

Switches to `openai-codex/gpt-6-luna` or `openai-codex/gpt-6.1-sol` while preserving conversation history. Uses existing Pi model registration and authentication.

### /commit

Generates a conventional commit message from the current pi session and git diff, opens it in an editor for review, then stages all changes and commits with the accepted message.

### `@path`

Automatically loads files and shallow directory listings referenced with `@path` into hidden context before each agent turn.

### /undo

Aborts the current pi turn if one is running, waits for pi to become idle, then rewinds the session without creating a summary.

### /revert

Stops the current pi workflow, stashes tracked and untracked repository changes, then rewinds the session to the first entry after the latest git commit.

### /diffity-diff

Displays the current repository’s working tree diff.

### /diffity-resolve

Resolves open diffity review threads.

### /caveman

Adds a concise, technical caveman-style prompt to every agent turn.

## Skills

### `/grill-me`

Stress-tests plans and decisions with focused questions, research, and trade-off analysis.

### `/code-simplification`

Clarifies code while preserving behavior.

### `/skill:ponytail`

Finds the smallest safe solution by reusing existing code and avoiding needless complexity.

### `/skill:typescript-best-practices`

Applies TypeScript type modeling, narrowing, and boundary validation practices.

## Sources

- `/grill-me`: [mattpocock/skills - /grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) — MIT
- `/caveman`: [kuba-guzik/caveman-micro](https://github.com/kuba-guzik/caveman-micro) — MIT
- `/skill:ponytail`: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md) — MIT
- `/skill:typescript-best-practices`: [cursor/plugins](https://github.com/cursor/plugins/blob/main/pstack/skills/typescript-best-practices/SKILL.md) — MIT
- `/code-simplification`: [getsentry/skills](https://github.com/getsentry/skills/blob/main/skills/code-simplifier/SKILL.md) — based on [Anthropic's code-simplifier agent](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md)
