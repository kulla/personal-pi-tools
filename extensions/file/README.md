# `@file` extension

**Implementation:** `extensions/file/index.ts`

Loads files referenced with `@path` before each agent turn.

## Behavior

- Supports multiple references and reads each path once per prompt.
- Loads files concurrently while preserving reference order.
- Uses Pi's built-in `read` tool, including truncation, image, and binary handling.
- Injects file contents as hidden `file-context` context while preserving the original prompt.
- Converts failed reads into short context errors without blocking other files.
- Does not resolve references found inside loaded files.
- Does not expand directories; ignores URLs and glob patterns.

## Check

Run from package root:

```bash
node --experimental-strip-types --test extensions/file/index.test.mjs
```
