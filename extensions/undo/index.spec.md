# `/undo` extension

**Implementation:** `extensions/undo/index.ts`

## Purpose and usage

`/undo` aborts the current pi turn if one is running, then waits for pi to
become idle.

## Behavior

On invocation:

1. If pi is currently processing a turn, abort it immediately.
2. Wait until pi is idle.
3. If aborting or waiting fails, log the error message.
