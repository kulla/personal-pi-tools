# AGENTS.md

- This is a personal pi tools package; keep changes small and avoid generic scaffolding.
- When adding pi-specific features, consult the relevant pi docs/examples first.
- Document each added tool/extension/skill with its purpose, inputs, and a minimal usage example.
- Update `README.md` when install, usage, or available features change.
- For TypeScript checks, run `./node_modules/.bin/tsc` directly and `./node_modules/.bin/biome` directly as part of validation.
  - Example: `./node_modules/.bin/tsc --noEmit`
  - Example: `./node_modules/.bin/biome check .`
