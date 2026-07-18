# personal-pi-tools

My personal [pi](https://github.com/earendil-works/pi) tools package.

## Install

```bash
pi install git:github.com/kulla/personal-pi-tools
```

## Extensions

### /commit

Source: `extensions/commit/index.ts`

Generates a conventional commit message from the current pi session and git diff, opens it in an editor for review, then stages all changes and commits with the accepted message. It also records each prompt sent to the LLM as a durable session entry.

Usage:

```text
/commit
```
