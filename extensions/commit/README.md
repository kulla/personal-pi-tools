# `/commit` extension

**Implementation:** `extensions/commit/index.ts`

Generates a one-line conventional commit subject from the current pi session and git state.

## Behavior

- Tries session prompts, then prompts plus assistant replies, then git status/diff/untracked file context.
- Temporarily switches to `openai-codex/gpt-5.4-mini`, asks for one conventional-commit subject, and restores the previous model.
- If the subject is valid, opens `git commit` in the editor with the generated message; the user can edit it before staging and committing.
- Adds `Assisted-by: provider/modelId` when the current session has user prompts.
