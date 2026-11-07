# `/undo` extension

**Implementation:** `extensions/undo/index.ts`

Aborts the current pi turn, waits for idle, and rewinds to the message before the last user message.

## Behavior

- Aborts the active turn if one is running.
- Navigates to the entry before the last user message without generating a summary. If none exists, navigates to the first entry; if the last user message is the first entry, stays there.

## Check

```bash
node --test extensions/undo/index.test.ts
```
