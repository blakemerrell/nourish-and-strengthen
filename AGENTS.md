# AGENTS.md

Guidance for any coding agent working in this repository (Antigravity,
Codex, Claude Code and others).

- **The rules are in [`CLAUDE.md`](CLAUDE.md).** Despite the name, it is the
  repo's rulebook for every agent: how the app is built (static ES5, no
  build step, no framework), the commands, the tests, and the conventions.
  Read it before changing anything.
- **The redesign in progress is in
  [`design/redesign/README.md`](design/redesign/README.md):** the plan, the
  mockup screenshots, and a status table. Claim a step in that table
  before you start one, and update it in the same PR as the work, so two
  agents never build the same step.
- Work one step per PR, branched off `main`, with tests.
