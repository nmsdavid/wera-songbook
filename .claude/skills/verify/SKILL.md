---
name: verify
description: Run the full quality gate (typecheck, lint, build) and report results
user-invokable: true
---

# Quality Gate: Verify

Run all three checks sequentially. Report each result clearly.

## Steps

1. Run `npm run typecheck` — report pass/fail with errors if any
2. Run `npm run lint` — report pass/fail with errors if any
3. Run `npm run build` — report pass/fail, show route summary on success

## Output Format

For each step, report:
- Pass or Fail (with error details if failed)
- At the end, give a summary: "X/3 checks passed"

If any check fails, stop and report the failure — do NOT continue to the next check.
