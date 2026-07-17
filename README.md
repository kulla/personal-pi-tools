# personal-pi-tools

My personal [pi](https://github.com/earendil-works/pi) tools package.

## Install

```bash
pi install git:github.com/kulla/personal-pi-tools
```

## Extensions

### /commit

Source: `extensions/commit/index.ts`

Generates an editable conventional commit message from the current pi session and git diff, which can then be changed in an editor. After approving it, it commits all changes in the worktree with that message.

Usage:

```text
/commit
```
