# personal-pi-tools

My personal [pi](https://github.com/earendil-works/pi) tools package.

## Install

```bash
pi install git:github.com/kulla/personal-pi-tools
```

## Extensions

### /commit

Generates a conventional commit message from the current pi session and git diff, opens it in an editor for review, then stages all changes and commits with the accepted message.

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

Grill the user one question at a time to stress-test a plan, decision, or idea.

### `/refactor`

Surgical code refactoring to improve maintainability without changing behavior.

## Sources

- `/grill-me`: [mattpocock/skills - /grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) — MIT
- `/caveman`: [kuba-guzik/caveman-micro](https://github.com/kuba-guzik/caveman-micro) — MIT
