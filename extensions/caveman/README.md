# `caveman` extension

**Implementation:** `extensions/caveman/index.ts`

Adds concise, technical caveman-style instructions as a structured prompt section on every agent turn, without replacing Pi's system prompt. Explicit forced system prompts override structured sections.

## Check

```bash
node --test extensions/caveman/index.spec.ts
```

## Source

[kuba-guzik/caveman-micro](https://github.com/kuba-guzik/caveman-micro) — MIT
