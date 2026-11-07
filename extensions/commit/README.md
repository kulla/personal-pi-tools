# `/commit` extension

**Implementation:** `extensions/commit/index.ts`

Generates a one-line conventional commit subject from the current pi session and git state.

## Behavior

- Tries session prompts together with assistant replies, then prompts alone, then git status/diff/untracked file context.
- Temporarily switches to `openai/gpt-6-luna` with low thinking level, asks for one conventional-commit subject, then restores the previous model and thinking level.
- If the subject is valid, opens Pi's editor with the generated message; the user can edit it before staging all changes and running `git commit`.
- Adds `Assisted-by: provider/modelId` when the current session has user prompts.
