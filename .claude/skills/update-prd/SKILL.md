---
name: update-prd
description: Update PRD.md after completing a feature step - move from Offen to Erledigt with commit hash
argument-hint: "[step-number] [commit-hash]"
user-invokable: true
---

# Update PRD After Feature Completion

Update PRD.md to reflect a completed feature step.

## Steps

1. Read `PRD.md`
2. Find the step number from `$ARGUMENTS[0]` (or the last completed step + 1)
3. Move the entry from the "Offen" table to the "Erledigt" table
4. Set the commit hash from `$ARGUMENTS[1]` (or run `git log --oneline -1` to get the latest)
5. Set branch to `develop`
6. Keep the description accurate — update it if the implementation differed from the plan
7. Check "Bekannte Issues" — add any new ones discovered, remove resolved ones

## Format

Erledigt table row:
```
| # | **Feature Name** – Brief description of what was actually built | `commit_hash` | develop |
```
