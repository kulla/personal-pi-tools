# `diffity` extension

**Implementation:** `extensions/diffity/index.ts`

## Purpose and usage

This extension provides two commands:

- `/diffity-diff` opens the diffity diff viewer for the current repository’s working tree changes.
- `/diffity-resolve` resolves open diffity review threads.

## `diffity` manual reference

Use `diffity --help` to access the CLI’s built-in manual and documentation when needed.

## `/diffity-diff`

On invocation:

1. Require the current directory to be a git repository with changes. If not, report an error and stop.
2. Check that `diffity` is available with `which diffity`. If it is not found, report an error and stop.
3. Check whether a diffity instance for the current repository is already running with `diffity list --json`. If one exists, reuse it and do not start a new one.
4. If no matching instance exists, run `diffity` in the background for the current worktree. Do not pass a ref or try to open the browser separately; diffity handles that itself. Keep the child process stderr attached to the current stderr so startup errors are visible.
5. Wait about 2 seconds, then run `diffity list --json` to discover the running instance.
6. Report a short status line with the local URL only, such as `http://localhost:5391`.
7. If launching, discovery, or reporting fails, report the error and stop.

## `/diffity-resolve`

On invocation:

1. Require `diffity` to be available. If it is not found, report an error and stop.
2. Require an active diffity review session. If there is none, report an error and stop.
3. List open review threads with `diffity agent list --status open --json`.
4. If there are no open threads, say there is nothing to resolve and exit cleanly.
5. Skip general comments (`__general__`).
6. Skip threads whose last agent comment is waiting for user input.
7. For each actionable thread, inject the thread into the current pi session one at a time, let the active agent make the code changes in that session, then resolve the diffity thread with the agent’s short result summary.
8. Do not rerun `diffity agent list` at the end.
9. Report completion and stop.
