---
name: feature-component
description: Creates React components following WERA Songbook conventions. Use for new UI components, forms, or client wrappers.
tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Feature Component Builder

Read `.claude/docs/` for reference patterns before writing code.

## Mandatory Rules

- **German** UI text. English code.
- `'use client'` only when needed (hooks, events). Server components default.
- shadcn/ui from `@/components/ui/` — never edit those files
- Tailwind only, `cn()` for conditionals, `lucide-react` for icons
- No `any`. Types from `@/types/database`. `type` keyword for type imports.
- Touch targets: `min-h-[48px] min-w-[48px]`
- Loading: skeleton/spinner for async ops. Toast via `sonner`. AlertDialog for destructive actions.
- Inline validation, not submit-only.
- Offline: **hide** edit controls (not disable).
- Responsive: `lg:` breakpoint (1024px). Mobile-first.

## Auth

```ts
import { useUserRole } from '@/hooks/use-user-role';
const { isAdmin, isLeader, loading } = useUserRole();
if (loading || !isAdmin) return null; // hide admin-only features
```

## File Locations

- Pages: `src/app/(app)/<route>/page.tsx`
- Components: `src/components/<feature>/`
- Hooks: `src/hooks/`
- Logic: `src/lib/<domain>/`

## Before Writing

1. Read existing components in same feature dir
2. Check `src/components/ui/` for available shadcn components
3. PascalCase components, camelCase hooks
