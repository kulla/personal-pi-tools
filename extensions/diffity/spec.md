# `diffity` extension

**Implementation:** `extensions/diffity/index.ts`

## Purpose and usage

This extension provides two commands:

- `/diffity-diff` opens the diffity diff viewer for the current repository’s working tree changes.
- `/diffity-resolve` resolves open diffity review threads.

## `/diffity-diff`

On invocation:

1. Require the current directory to be a git repository with changes. If not, report an error and stop.
2. Check that `diffity` is available with `which diffity`. If it is not found, report an error and stop.
3. Run `diffity` in the background for the current worktree. Do not pass a ref or try to open the browser separately; diffity handles that itself.
4. Wait about 2 seconds, then run `diffity list --json` to discover the running instance.
5. Report a short status line with the local URL only, such as `http://localhost:5391`.
6. If launching, discovery, or reporting fails, report the error and stop.

## `/diffity-resolve`

On invocation:

1. Require `diffity` to be available. If it is not found, report an error and stop.
2. Require an active diffity review session. If there is none, report an error and stop.
3. List open review threads with `diffity agent list --status open --json`.
4. If there are no open threads, say there is nothing to resolve and exit cleanly.
5. Skip general comments (`__general__`).
6. Skip threads whose last agent comment is waiting for user input.
7. For each actionable thread, read the relevant source context, apply the requested fix automatically, then resolve the thread with a short summary.
8. For `[question]` threads, answer the question, then resolve the thread with that answer as the summary.
9. Do not rerun `diffity agent list` at the end.
10. Report completion and stop.
