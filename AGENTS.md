# AGENTS.md

- This is a personal pi tools package; keep changes small and avoid generic scaffolding.
- Do not silently fail; surface errors clearly.
- Keep implementations simple and easy to understand; follow KISS.
- There are colocated spec files with the `.spec.md` suffix; keep them in sync with implementation changes.
- For TypeScript checks, run `./node_modules/.bin/tsc` directly and `./node_modules/.bin/biome` directly as part of validation.
  - Example: `./node_modules/.bin/tsc --noEmit`
  - Example: `./node_modules/.bin/biome check .`
