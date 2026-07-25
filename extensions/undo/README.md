# `/undo` extension

**Implementation:** `extensions/undo/index.ts`

Aborts the current pi turn, waits for idle, and rewinds to the message before the last user message.

## Behavior

- Aborts the active turn if one is running.
- Waits until pi is idle.
- Navigates to the entry before the last user message, or to the start of the session if there is no user message.
- Does not create a summary.
