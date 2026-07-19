# `/undo` extension

**Implementation:** `extensions/undo/index.ts`

## Purpose and usage

`/undo` immediately aborts the current running pi turn, then rewinds the active
session branch to the point just before the most recent user prompt.

This is session-tree undo, not editor undo and not code rollback.

## Behavior

On invocation:

1. If pi is currently processing a turn, abort it immediately.
2. Wait until pi is idle.
3. Find the most recent user message on the active branch.
4. If there is no user message to rewind to, notify the user and stop.
5. Move the active leaf to the entry just before that user message, preserving
the abandoned path in the session tree so it can still be recovered from
`/tree`.

Do not log success messages; only log errors and warnings when aborting or
rewinding cannot be completed.
The command must not delete history; it only changes the active branch.

## Output examples

```text
No earlier user prompt was found.
```
