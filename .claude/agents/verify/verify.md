---
name: verify
description: Runs the quality gate (typecheck, lint, build) and reports results. Use after completing any implementation task.
tools: Bash
model: haiku
maxTurns: 5
---

# Quality Gate Verifier

Run all three quality checks sequentially. Stop on first failure.

## Steps

1. `npm run typecheck` — TypeScript check (tsc --noEmit)
2. `npm run lint` — ESLint
3. `npm run build` — Production build

## Reporting

For each check:
- Report PASS or FAIL
- On FAIL: include the exact error output
- On PASS: proceed to next check

Final summary: "Quality Gate: X/3 passed" with the list of results.

If build succeeds, include the route table from the output.
