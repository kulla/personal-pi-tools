# `/commit` extension

**Implementation:** `extensions/commit/index.ts`

## Purpose and usage

`/commit` prepares a concise conventional-commit subject from the current pi
session and repository state.

## Behavior

On invocation:

1. Stop if the current directory is not a git repository or has no changes.
2. Get the latest commit timestamp (`git log -1 --format=%ct`). Consider only
   pi session entries newer than that timestamp.
3. Try these context candidates, in order:
   1. all user prompts;
   2. those user prompts plus related AI result messages;
   3. a git fallback containing `git status --porcelain`, staged and working-tree
      `git diff`, and contents or summaries of untracked/new files.
4. Before asking the AI, temporarily switch to
   `openai-codex/gpt-5.4-mini` (the equivalent of `/model openai-codex/gpt-5.4-mini`),
   saving the previously active model. For each candidate, ask that model through
   the pi SDK to produce a conventional-commit subject. Restore the saved model
   after generation completes, including when an AI request throws or fails.
   Before and after each request, show a log entry
   with the prompt sent to the AI and the answer received. Log entries render
   as plain message text without a level prefix or background, using accent,
   warning, or error colors. If the session contains user prompts after the last
   commit, seed the editable commit template with `Assisted-by: provider/modelId`
   using the previously active model. If the model says the context is
   insufficient, try the next candidate. If the model is unavailable or
   authentication fails, notify the user and stop.
5. Limit the combined git-fallback context (status, both diffs, and untracked
   summaries) to 5,000 characters; when truncating, append a clear marker.
6. On a valid one-line subject, open `git commit` in the user’s editor with
   the generated subject as the template so the user can review and change it.
   Only if the commit message is accepted, run `git add -A`; if staging fails,
   notify the user and stop. Then commit the staged changes.
7. If no candidate produces a subject, notify the user that one could not be
   generated.

The model must return either a conventional-commit message or an explicit
“context is not enough” response. Analyze only the current session and current
repository state.

## Output examples

```text
feat(editor): improve cursor handling
fix(toolbar): prevent duplicate actions
```
