---
name: next-step
description: Read PRD.md, identify the next open step, and prepare an implementation plan
user-invokable: true
---

# Next Step from PRD

Read the PRD and identify the next feature to implement.

## Steps

1. Read `PRD.md` — find the "Offen (Reihenfolge)" table
2. Identify the first open item (lowest number)
3. Read `CLAUDE.md` for relevant technical constraints
4. Explore the current codebase to understand what exists:
   - Check relevant directories mentioned in the PRD step
   - Read existing components that the new feature will build on
   - Check which shadcn/ui components are already installed
5. Present a structured implementation plan:
   - **Feature name and number**
   - **New shadcn components needed** (if any)
   - **Files to create** (with purpose)
   - **Files to modify** (with what changes)
   - **Key technical decisions** (patterns, state management, API approach)
   - **Suggested implementation order**

## Output Format

Use a clear markdown structure with tables for file lists.
Reference CLAUDE.md rules that apply to this specific feature.
All UI labels in German as per project rules.
