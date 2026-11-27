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

Adds a technical caveman-style prompt to every agent turn; explanations favor clarity and pseudocode over brevity.

## Skills

### `/grill-me`

Stress-tests plans and decisions with focused questions, research, and trade-off analysis.

### `/code-simplification`

Clarifies code while preserving behavior.

### `/skill:minimal-implementation`

Finds the smallest safe solution by reusing existing code and avoiding needless complexity.

### `/skill:typescript-best-practices`

Applies TypeScript type modeling, narrowing, and boundary validation practices.

### `/skill:design-robust-systems`

Designs data models, boundaries, and state-changing operations for new or evolving systems.

### `/skill:design-user-experience`

Prioritizes user experience and compares prototypes before committing to novel designs.

### `/skill:writing-tests`

Writes unit, integration, and end-to-end tests that verify observable behavior rather than implementation details.

## Sources

- `/grill-me`: [mattpocock/skills - /grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) — MIT
- `/caveman`: [kuba-guzik/caveman-micro](https://github.com/kuba-guzik/caveman-micro) — MIT
- `/skill:minimal-implementation`: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md) — MIT; also incorporates:
  - [Subtract Before You Add](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-subtract-before-you-add/SKILL.md)
  - [Laziness Protocol](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-laziness-protocol/SKILL.md)
  - [Minimize Reader Load](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-minimize-reader-load/SKILL.md)
- `/skill:typescript-best-practices`: [cursor/plugins](https://github.com/cursor/plugins/blob/main/pstack/skills/typescript-best-practices/SKILL.md) — MIT
- `/skill:design-robust-systems`: [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills) — MIT; combines:
  - [Foundational Thinking](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-foundational-thinking/SKILL.md)
  - [Model the Domain](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-model-the-domain/SKILL.md)
  - [Type System Discipline](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-type-system-discipline/SKILL.md)
  - [Boundary Discipline](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-boundary-discipline/SKILL.md)
  - [Redesign From First Principles](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-redesign-from-first-principles/SKILL.md)
  - [Separate Before Serializing Shared State](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md)
  - [Make Operations Idempotent](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-make-operations-idempotent/SKILL.md)
- `/skill:design-user-experience`: [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills) — MIT; combines:
  - [Experience First](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-experience-first/SKILL.md)
  - [Exhaust the Design Space](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-exhaust-the-design-space/SKILL.md)
- `/skill:writing-tests` (Test Behavior, Not Implementation): [cursor/plugins](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-test-behavior-not-implementation/SKILL.md) — MIT
- `/code-simplification`: [getsentry/skills](https://github.com/getsentry/skills/blob/main/skills/code-simplifier/SKILL.md) — based on [Anthropic's code-simplifier agent](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md)
