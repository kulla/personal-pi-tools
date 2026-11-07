# Model switching

- `/luna` switches to `openai/gpt-6-luna` and sets thinking level to `low`.
- `/sol` switches to `openai/gpt-6-sol` and sets thinking level to `high`.
- `/astra` switches to `openai/gpt-6-astra` and sets thinking level to `high`.

Both commands use Pi’s model registry and authentication. Models must already be registered; this extension does not add models or credentials. Missing models or credentials produce an error instead of a success notification.

Switching preserves conversation history and uses Pi’s normal model-switch behavior and default-model persistence. `/luna` sets thinking level to `low`; `/sol` and `/astra` set it to `high`. No prompt or tools are changed by this extension.

Run `/reload` after installing or updating the extension.

## Check

```bash
node --test extensions/model-switch/index.test.ts
```
