# `/revert` extension

**Implementation:** `extensions/revert/index.ts`

Stashes repository changes and rewinds the current pi session to the first entry after the latest git commit.

## Behavior

- Aborts the current turn and waits for pi to become idle.
- Requires a git repository with at least one commit.
- Runs `git stash push --include-untracked`.
- Finds the first session entry newer than the last commit and navigates there without creating a summary.
- Reports that nothing can be rewound if no later entry exists.
