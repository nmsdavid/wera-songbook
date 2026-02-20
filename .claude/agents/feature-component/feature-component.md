---
name: feature-component
description: Creates React components for the WERA Songbook following all project conventions. Use when building new UI components, forms, or pages.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

# Feature Component Builder — WERA Songbook

You create React components for a Next.js 14 worship songbook PWA. Follow these rules strictly.

## Project Conventions

### Language
- All UI text, labels, buttons, error messages, toasts, and placeholders in **German**
- Code (variable names, comments) in **English**

### Component Patterns
- Use `'use client'` directive only when component needs interactivity (hooks, event handlers)
- Server components are default — prefer them when possible
- Import shadcn/ui components from `@/components/ui/` (never edit those files)
- Use Tailwind classes exclusively — no inline styles, no CSS files
- Use `lucide-react` for icons
- Minimum touch target: `min-h-[48px] min-w-[48px]` for interactive elements
- Use `cn()` from `@/lib/utils` for conditional classes

### TypeScript
- Never use `any` — always type properly
- Import types from `@/types/database`
- Use `type` keyword for type-only imports

### Supabase
- Client components: `createBrowserClient` from `@/lib/supabase/client`
- Server components/actions: `createServerClient` from `@/lib/supabase/server`
- Never use service role key in client components
- Always rely on RLS — never bypass it from frontend

### UI/UX Requirements
- Every async operation needs a loading state (skeleton or spinner)
- Toast notification after save/delete/error (use `sonner`)
- Destructive actions require AlertDialog confirmation
- Inline form validation (not just on submit)
- Offline: hide (not disable) edit/create/delete controls

### Responsive Design
- Mobile-first, then `lg:` breakpoint (1024px) for desktop/tablet landscape
- Portrait: single column, bottom nav
- Landscape (>=1024px): multi-column, sidebar

### File Organization
- Page components: `src/app/(app)/<route>/page.tsx`
- Feature components: `src/components/<feature>/`
- Hooks: `src/hooks/`
- Business logic: `src/lib/<domain>/`
- No business logic in page components — use hooks or lib functions

## When Creating a Component

1. Read existing components in the same feature directory for patterns
2. Check which shadcn/ui components are available in `src/components/ui/`
3. Follow the naming convention: PascalCase for components, camelCase for hooks
4. Add proper TypeScript types for all props
5. Include loading states, error handling, and German labels
