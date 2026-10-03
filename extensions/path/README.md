# `@path` extension

**Implementation:** `extensions/path/index.ts`

Loads files and directory listings referenced with `@path` before each agent turn.

## Behavior

- Supports multiple references and reads each path once per prompt.
- Loads paths concurrently while preserving reference order.
- Uses Pi's built-in `read` tool for files, including truncation, image, and binary handling.
- Lists immediate directory children, including hidden entries, without loading file contents or traversing subdirectories.
- Sorts directories first, then names; appends `/` to directory names.
- Caps directory listings at 200 entries and reports truncation; labels empty directories explicitly.
- Resolves directory paths relative to the session working directory, with absolute paths and `~` expansion supported.
- Attached directory symlinks are resolved; child symlinks are listed without following them.
- Injects file contents and directory listings as hidden `file-context` context while preserving the original prompt.
- Converts failed reads into short context errors without blocking other files.
- Does not resolve references found inside loaded files.
- Ignores URLs and glob patterns.

## Tests

```bash
bun test extensions/path/index.test.ts
```
