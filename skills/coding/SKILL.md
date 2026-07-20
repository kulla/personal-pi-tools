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
- Keep code easy to read; avoid clever or speculative abstractions.
- Do not add dependencies, frameworks, or broad scaffolding unless required.

## Code Quality
- Keep functions focused and names descriptive.
- Remove duplication when it improves clarity; do not abstract prematurely.
- Handle errors explicitly; never fail silently.
- Validate untrusted inputs and never hardcode secrets.
- Document why something is non-obvious; avoid comments that repeat code.
- Consider performance and security, but avoid premature optimization.

## Design Defaults
- KISS: choose the simplest correct solution.
- YAGNI: build only what is needed now.
- DRY: avoid repeated logic, not harmless repetition.
- SRP: each module/function should have one clear responsibility.
- Prefer composition over inheritance.

## Verify
- Review the diff against the request.
- Check edge cases and failure paths.
- Run the project’s relevant formatter, typecheck, and tests when practical.
- If validation is skipped, say why.
