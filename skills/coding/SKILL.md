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
- YAGNI: build only what is needed now.
- DRY: avoid repeated logic, but allow small duplication if it is clearer than abstraction.
- SRP: each module/function should have one clear responsibility.
- Prefer composition over inheritance.

## Verify
- Review the diff against the request.
- Ask: could a new teammate understand this in 30 seconds?
- Check for needless nesting, clever shortcuts, mixed responsibilities, and magic values.
- Check edge cases and failure paths.
- Run the project’s relevant formatter, typecheck, and tests when practical.
- If validation is skipped, say why.
