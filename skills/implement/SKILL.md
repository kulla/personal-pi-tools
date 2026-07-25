---
name: implement
description: "MUST use for implementation tasks on source code: implement, edit, debug, review, or refactor source files. Keep changes simple, safe, and aligned with the existing project."
---

# Implement

Follow this checklist before editing and before reporting completion.

## Understand

- Read project instructions, relevant code, callers, tests, and colocated documentation.
- Confirm the requested behavior and constraints; inspect rather than guess.
- For bugs, reproduce the failure or establish another observable baseline.
- Choose the smallest change that fully solves the request.

## Implement

- Follow existing APIs, naming, style, and architecture.
- Prefer direct, explicit control flow and well-understood tools.
- Keep functions focused; use clear names, guard clauses, and small helpers when they improve readability.
- Handle errors explicitly, validate untrusted input, and never hardcode secrets.
- Explain non-obvious decisions, not code that already explains itself.
- Keep public behavior stable unless the task requires a change.

## Control Scope

- Do not add speculative features, options, abstractions, dependencies, or scaffolding.
- Remove duplication only when the shared concept is clear; small duplication can be simpler.
- Avoid clever one-liners, hidden control flow, deep nesting, and premature optimization.
- Make only safe, local cleanup in touched code. Separate broader refactors from the task.

## Verify

- Review the diff against the request and remove accidental or unrelated changes.
- Check normal, boundary, error, security, and performance-sensitive paths as relevant.
- Run focused tests, then the project formatter, type-checker, and broader tests when practical.
- Keep documentation and specifications synchronized with behavior.
- Report what changed, validation performed, and any skipped checks or remaining risks.
