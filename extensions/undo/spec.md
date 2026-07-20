# `/undo` extension

**Implementation:** `extensions/undo/index.ts`

## Purpose and usage

`/undo` aborts the current pi turn if one is running, then waits for pi to
become idle and rewinds the session without a summary.

## Behavior

On invocation:

1. If pi is currently processing a turn, abort it immediately.
2. Wait until pi is idle.
3. Navigate the tree to the message before the last user message without creating a summary.
4. If there is no user message, navigate to the beginning of the session.
5. If aborting, waiting, or navigation fails, log the error message.
