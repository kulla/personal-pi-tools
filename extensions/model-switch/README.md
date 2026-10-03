# Model switching

- `/luna` switches to `openai-codex/gpt-6-luna`.
- `/sol` switches to `openai-codex/gpt-6.1-sol`.

Both commands use Pi’s model registry and authentication. Models must already be registered; this extension does not add models or credentials. Missing models or credentials produce an error instead of a success notification.

Switching preserves conversation history and uses Pi’s normal model-switch behavior, including thinking-level handling and default-model persistence. No prompt or tools are changed by this extension.

Run `/reload` after installing or updating the extension.

## Check

```bash
node --test extensions/model-switch/index.test.ts
```
