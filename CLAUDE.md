@AGENTS.md

## Working style

- If my request is ambiguous, ask one question before editing instead of guessing.
- Don't expand scope or refactor/rename/clean up working code unless asked; propose it as a separate step instead.
- Prefer the simplest solution that works (YAGNI). No backward-compat shims in code (adapters, optional params kept for old callers) unless I ask; update all call sites instead.
- Name things plainly; no invented terms or phase/section IDs.
- At the end, state in one line what you didn't test.
