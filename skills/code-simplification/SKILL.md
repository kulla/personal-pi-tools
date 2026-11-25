---
name: code-simplification
description: Simplifies and refines code for clarity, consistency, and maintainability while preserving behavior. Use when asked to simplify code, clean up code, refactor for clarity, improve readability, or review recently modified code.
---

# Code Simplification

Simplify code for clarity, consistency, and maintainability without changing behavior. Prefer readable, explicit code over compact solutions that take more effort to understand.

## Refinement Principles

### 1. Preserve Behavior Exactly

Don't change what the code does — only how it expresses it. All inputs, outputs, side effects, error behavior, and edge cases must remain identical. If you're not sure a simplification preserves behavior, don't make it.

```
ASK BEFORE EVERY CHANGE:
→ Does this produce the same output for every input?
→ Does this maintain the same error behavior?
→ Does this preserve the same side effects and ordering?
→ Do all existing tests still pass without modification?
```

### 2. Apply Project Standards

Read project instructions (such as `AGENTS.md` or `CLAUDE.md`), necessary skills for the particular domain and neighboring code before editing. Match established conventions for imports, functions, types, components, naming, and error handling. Do not impose another project's rules.

### 3. Enhance Clarity

- Reduce unnecessary complexity and nesting.
- Remove redundant code and abstractions.
- Use clear variable and function names.
- Consolidate related logic when it improves understanding.
- Remove comments that only restate obvious code; retain comments that explain intent or constraints.
- Avoid nested ternary operators; prefer readable conditionals for multiple branches.
- Choose clarity over brevity.

### 4. Maintain Balance

Do not simplify in ways that make code harder to read, debug, or extend. Keep helpful abstractions and separate concerns. Fewer lines do not necessarily mean simpler code. Explicit code is better than compact code when the compact version requires a mental pause to parse.

### 5. Focus Scope

Refine recently modified code or code touched in the current session unless asked to review a broader scope. Avoid unrelated refactors.

## Refinement Process

1. Identify code in scope and understand its behavior and constraints.
2. Look for opportunities to improve clarity and consistency.
3. Apply the smallest useful changes following project conventions.
4. Verify behavior remains unchanged with relevant tests or checks.
5. Keep changes only if the result is easier to understand. Explain significant changes when needed.

## Examples

### Nested ternary → clear conditions

```typescript
// Before
const status = isLoading ? "loading" : hasError ? "error" : isComplete ? "complete" : "idle"

// After
function getStatus(isLoading: boolean, hasError: boolean, isComplete: boolean): string {
  if (isLoading) return "loading"
  if (hasError) return "error"
  if (isComplete) return "complete"
  return "idle"
}
```

### Overly compact → clear steps

```typescript
// Before
const result = arr
  .filter((x) => x > 0)
  .map((x) => x * 2)
  .reduce((a, b) => a + b, 0)

// After
const positiveNumbers = arr.filter((x) => x > 0)
const doubled = positiveNumbers.map((x) => x * 2)
const sum = doubled.reduce((a, b) => a + b, 0)
```

### Redundant abstraction → direct check

```typescript
// Before
function isNotEmpty(items: unknown[]): boolean {
  return items.length > 0
}

if (isNotEmpty(items)) {
  // ...
}

// After
if (items.length > 0) {
  // ...
}
```
