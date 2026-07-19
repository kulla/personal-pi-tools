---
name: refactor
description: 'Surgical code refactoring to improve maintainability without changing behavior. Covers extracting functions, renaming variables, breaking down god functions, improving type safety, eliminating code smells, and applying design patterns. Less drastic than repo-rebuilder; use for gradual improvements.'
license: MIT
---

# Refactor

Improve structure and readability without changing externally observable behavior. Refactoring is gradual evolution, not a rewrite.

## When to Use

Use this skill when code is hard to understand, functions or classes are too large, code smells impede maintenance, or a feature is difficult to add because of structure.

Do not refactor merely for style. Add characterization tests first for critical production code that lacks coverage, and avoid mixing refactoring with feature changes.

## Inputs

- Target files or module and the specific maintainability problem.
- Existing tests, build commands, lint rules, and type-check configuration.
- Constraints on public APIs, performance, compatibility, and allowed dependencies.

If the target or behavior is unclear, inspect callers, tests, and configuration before editing. Do not guess at intended behavior.

## Procedure

### Step 1: Establish a safe baseline

Read the target and its callers. Identify the current behavior, public interfaces, side effects, and relevant tests. Run the narrowest useful test, type-check, and lint commands before changing anything.

**Expected:** The behavior to preserve and a passing (or documented failing) baseline are recorded.

**On failure:** Stop and report baseline failures or missing coverage; do not conceal them by changing implementation first.

### Step 2: Select one smell and a small transformation

Choose one focused operation: extract method/class, rename for clarity, introduce a parameter object, replace a magic value with a constant, add types, use guard clauses, encapsulate access, or remove dead code. Prefer the smallest change that improves the identified problem.

For examples of the common smells and transformations, see [EXAMPLES.md](references/EXAMPLES.md#refactoring-examples).

**Expected:** The proposed change has a clear purpose and preserves inputs, outputs, errors, ordering, and side effects.

**On failure:** Narrow the scope or add characterization tests. Do not combine unrelated cleanup with the refactor.

### Step 3: Make the smallest behavior-preserving edit

Keep public APIs stable unless the task explicitly permits a change. Preserve error semantics and observable ordering. Use descriptive names and single-purpose functions; avoid introducing abstractions that have only one unexplained use.

A useful orchestration shape is:

```ts
async function processOrder(id: string) {
  const order = await fetchOrder(id);
  validateOrder(order);
  return saveOrder(order);
}
```

For larger before/after examples, see [EXAMPLES.md](references/EXAMPLES.md#long-method).

**Expected:** The diff addresses one smell, is easy to review, and contains no accidental feature or dependency changes.

**On failure:** Revert or reduce the edit, then compare the diff against the baseline behavior and tests.

### Step 4: Verify incrementally

Run focused tests after the edit, then the project type-checker and linter. Exercise edge cases affected by the change, including invalid input and error paths. Repeat in small increments when several related edits are necessary.

**Expected:** Focused tests and static checks pass, with no new diagnostics.

**On failure:** Surface the exact command and diagnostic. Fix the regression before proceeding; never silence a check or swallow an exception.

### Step 5: Review the resulting design

Inspect the final diff and callers. Confirm names communicate intent, responsibilities are cohesive, dependencies remain appropriately directed, and no dead code or duplicate logic was left behind. Check that comments explain decisions rather than restating code.

**Expected:** The result is simpler to maintain and the public behavior remains compatible.

**On failure:** Remove speculative abstractions or split the change into smaller, independently verifiable edits.

## Validation

- [ ] Baseline behavior and relevant tests were identified.
- [ ] The diff changes one refactoring concern and preserves public behavior.
- [ ] Tests cover normal, boundary, and error paths affected by the edit.
- [ ] Type-checking and linting pass without suppressed diagnostics.
- [ ] Public APIs, side effects, ordering, and performance-sensitive paths were reviewed.
- [ ] No unused code, unexplained constants, or unnecessary dependencies remain.

## Common Pitfalls

- **Changing behavior accidentally:** compare outputs, errors, side effects, and ordering before and after.
- **Refactoring without tests:** write characterization tests before changing unverified logic.
- **Over-extracting:** keep a function cohesive; do not create wrappers with no meaningful name or reuse.
- **Mixing concerns:** separate formatting, feature work, dependency upgrades, and refactoring.
- **Abstraction for its own sake:** prefer a small direct helper until a repeated concept is clear.
- **Hiding failures:** report failing commands and diagnostics instead of broad catches or disabled checks.

## Related Skills

- Use `repo-rebuilder` when the task is a deliberate rewrite rather than a behavior-preserving refactor.
- Use `refactor-skill-structure` when a `SKILL.md` itself exceeds the line limit or needs structural extraction.
- Use the project’s testing or review skill when specialized validation is required.
