---
name: coding
description: "MUST use for all coding tasks: implement, edit, debug, review, or refactor code. Keep changes simple, safe, and aligned with the existing project."
---

# Coding

Use this checklist before changing code and before replying.

## Work Style
- Read relevant files and project instructions first.
- Make the smallest change that solves the task.
- Prefer existing patterns, APIs, naming, and style.
- Leave touched code a little better when the fix is obvious, safe, and in scope.
- Optimize for reading, not writing; clear extra lines beat clever compression.
- Use boring, well-understood tools and explicit control flow.
- Do not add dependencies, frameworks, or broad scaffolding unless required.

## Code Quality
- Keep functions focused: one function, one job.
- Use names that say what code does, not implementation mechanics.
- Limit nesting; prefer guard clauses, early returns, or small helpers.
- Remove duplication when it improves clarity; do not abstract prematurely.
- Prefer explicit values, state, and types over magic or hidden behavior.
- Handle errors explicitly; never fail silently.
- Validate untrusted inputs and never hardcode secrets.
- Document why something is non-obvious; avoid comments that repeat code.
- Consider performance and security, but avoid premature optimization.

## Simplicity Defaults
- KISS: choose the easiest correct solution to read, understand, and change.
- Simple is not naive: keep validation, error handling, and right data structures.
- Simple is not primitive: use a well-chosen library or pattern when it reduces code.
- Avoid clever one-liners, deep generics, factory chains, god functions, and hidden control flow.
- YAGNI: solve today's requirement; refactor when real requirements appear.
- DRY: avoid repeated logic, but allow small duplication if it is clearer than abstraction.
- SRP: each module/function should have one clear responsibility.
- Prefer composition over inheritance.

## YAGNI Checks
- Do not add features, config, parameters, flags, columns, caches, services, or plugin systems "just in case".
- Prefer direct code for one use case; abstract after repeated real use, not before.
- Avoid interfaces/base classes with one implementation unless the project already requires them.
- Remove unused code paths and options; they still need tests, maintenance, and debugging.
- Duplication can be cheaper than the wrong abstraction; wait until the pattern is clear.
- YAGNI does not excuse weak structure, missing error handling, or ignoring known production failures.

## Boy Scout Rule
- In files you already touch, make small safe cleanups: clear names, dead imports, missing types, stale comments, magic values, simple warnings.
- Do not refactor unfamiliar code without understanding it.
- Do not turn incidental cleanup into redesign, behavior change, or multi-module work.
- If cleanup is larger than ~20 lines, crosses module boundaries, or needs review, treat it as a separate refactor/task.
- Keep cleanup separable from feature changes when possible; never make reverts risky.

## Verify
- Review the diff against the request.
- Ask: could a new teammate understand this in 30 seconds?
- Check for needless nesting, clever shortcuts, mixed responsibilities, and magic values.
- Check edge cases and failure paths.
- Run the project’s relevant formatter, typecheck, and tests when practical.
- If validation is skipped, say why.
