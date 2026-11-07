# `/commit` extension

**Implementation:** `extensions/commit/index.ts`

Generates a one-line conventional commit subject from the current pi session and git state.

## Behavior

- Tries session prompts together with assistant replies, then prompts alone, then git status/diff/untracked file context.
- Calls `openai/gpt-6-luna` through Pi's model registry with low reasoning for one conventional-commit subject, without changing the session model or thinking level.
- If the subject is valid, opens Pi's editor with the generated message; the user can edit it before staging all changes and running `git commit`.
- Adds `Assisted-by: provider/modelId` when the current session has user prompts.

## Check

```bash
node --test extensions/commit/index.test.ts
```
