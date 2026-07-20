# `/diffity-diff` extension

**Implementation:** `extensions/diffity/index.ts`

## Purpose and usage

`/diffity-diff` opens the diffity diff viewer for the current repository’s working tree changes.

## Behavior

On invocation:

1. Require the current directory to be a git repository with changes. If not, report an error and stop.
2. Check that `diffity` is available with `which diffity`. If it is not found, report an error and stop.
3. Run `diffity` in the background for the current worktree. Do not pass a ref or try to open the browser separately; diffity handles that itself.
4. Wait about 2 seconds, then run `diffity list --json` to discover the running instance.
5. Report a short status line with the local URL only, such as `http://localhost:5391`.
6. If launching, discovery, or reporting fails, report the error and stop.

## Output

```text
Diffity is running at http://localhost:5391
```
