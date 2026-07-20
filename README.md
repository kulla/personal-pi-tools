# personal-pi-tools

My personal [pi](https://github.com/earendil-works/pi) tools package.

## Install

```bash
pi install git:github.com/kulla/personal-pi-tools
```

## Extensions

### /commit

Source: `extensions/commit/index.ts`

Generates a conventional commit message from the current pi session and git diff, opens it in an editor for review, then stages all changes and commits with the accepted message. It tries user prompts first, then user prompts plus AI result messages, records durable info/warning/error log entries for each prompt sent to the LLM, and seeds the final template with `Assisted-by: provider/modelId` when the session has user prompts after the last commit.

Usage:

```text
/commit
```

## Skills

### `/grill-me`

Grill the user one question at a time to stress-test a plan, decision, or idea.

## Utilities

### `utils/logging.ts`

Reusable log-entry renderer/helper for extensions.

Usage:

```ts
import { createLogger } from "./utils/logging.ts";

const logger = createLogger(pi, "my-log");
logger.log("Hello", "info");
```

## Sources

- `/grill-me`: [mattpocock/skills - /grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) — MIT
