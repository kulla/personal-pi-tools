# `diffity` extension

**Implementation:** `extensions/diffity/index.ts`

Provides `/diffity-diff` and `/diffity-resolve` for working with diffity.

## Behavior

- `/diffity-diff` requires a git repo with changes, reuses an existing diffity instance when possible, otherwise starts one in the background, then reports the local URL.
- `/diffity-resolve` requires an active diffity review session, skips non-actionable threads, sends each actionable thread into the current pi session, and resolves it with the agent summary.
- Use `diffity --help` for the CLI’s full manual.
