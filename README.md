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

## Skills

### `/grill-me`

Grill the user one question at a time to stress-test a plan, decision, or idea.

### `/implement`

Must use for all implementation tasks: implement, edit, debug, review, or refactor code. Keep changes simple, safe, and aligned with the existing project.

### `/refactor`

Surgical code refactoring to improve maintainability without changing behavior.

### `/refactor-skill-structure`

Refactor an over-long or poorly structured `SKILL.md` by extracting examples, splitting compound procedures, and reorganizing for progressive disclosure.

## Sources

- `/grill-me`: [mattpocock/skills - /grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) — MIT
- `/implement`: [JordanCoin/codingskills](https://github.com/JordanCoin/codingskills/) — MIT; [davidkiss/smart-ai-skills/skills/coding](https://github.com/davidkiss/smart-ai-skills/tree/main/skills/coding)
