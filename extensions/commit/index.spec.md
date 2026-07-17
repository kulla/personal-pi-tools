# `/commit` extension

**Implementation:** `extensions/commit/index.ts`  
**Discovery:** `.pi/extensions` symlinks to `extensions/`.

## Purpose and usage

`/commit` prepares a concise conventional-commit subject from the current pi
session and repository state. It is available as a project-local command and
should be run in a trusted repository with pending changes.

## Behavior

On invocation:

1. Stop if the current directory is not a git repository or has no changes.
2. Get the latest commit timestamp (`git log -1 --format=%ct`). Consider only
   pi session entries newer than that timestamp.
3. Try these context candidates, in order:
   1. all AI result messages;
   2. those result messages plus related user prompts;
   3. a git fallback containing `git status --porcelain`, staged and working-tree
      `git diff`, and contents or summaries of untracked/new files.
4. For each candidate, ask **gpt-4o-mini** through the pi SDK to produce a
   conventional-commit subject. If it says the context is insufficient, try the
   next candidate. If the model is unavailable or authentication fails, notify
   the user and stop.
5. Limit the combined git-fallback context (status, both diffs, and untracked
   summaries) to 5,000 characters; when truncating, append a clear marker.
6. On a valid one-line subject, run `git add -A`. If staging fails, notify the
   user and stop. Invoke `git commit` with the generated subject as a template;
   do not auto-commit or bypass user review—the commit must remain editable and
   confirmable.
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
