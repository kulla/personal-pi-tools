# `/revert` extension

**Implementation:** `extensions/revert/index.ts`

Stashes repository changes and rewinds the current pi session to the first entry after the latest git commit.

## Behavior

- Aborts the current turn and waits for pi to become idle.
- Checks that the repository has a commit, then runs `git stash push --include-untracked`.
- Finds the first session entry newer than the last commit and navigates there without creating a summary; reports when no entry exists.
