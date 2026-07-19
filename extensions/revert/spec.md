# `/revert` extension

**Implementation:** `extensions/revert/index.ts`

`/revert` stops the current pi workflow, stashes all repository changes, and
rewinds the session to the first entry after the latest git commit.

## Behavior

1. Abort an active turn, then wait for pi to become idle.
2. Require a git repository with at least one commit.
3. Run `git stash push --include-untracked` to remove tracked and untracked changes
   from the working tree.
4. Read the latest commit time with `git log -1 --format=%ct`.
5. On the current session branch, find the earliest entry newer than that time.
6. Navigate to that entry with `ctx.navigateTree(entryId, { summarize: false })`.

The navigation must not create a branch summary. If stashing, navigation, or
any other operation fails, report the error and stop. If no entry follows the
last commit, leave the session position unchanged and report that there is
nothing to rewind.