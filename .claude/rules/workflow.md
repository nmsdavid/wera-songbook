# Workflow Rules — WERA Songbook

These rules govern how work is done in this repository. Follow them for every change.

---

## 1. Quality Gate (mandatory before every commit)

Run all three checks in order. Stop on first failure:

```bash
npm run typecheck   # TypeScript (tsc --noEmit)
npm run lint        # ESLint (eslint src/)
npm run build       # Next.js production build
```

Use `/verify` skill or the `verify` agent for this. Never commit code that fails any check.

---

## 2. Commit Conventions

- **Format**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)
- **Language**: English commit messages, concise (1-3 sentence body)
- **Co-author**: Always append `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- **Staging**: Stage specific files — never use `git add -A` or `git add .`
- **Secrets**: Never commit `.env.local`, `.env`, credentials, or API keys
- **Branch**: Work on `develop`. Never force-push. Never push to `main` without user confirmation.
- Use `/commit-push` skill for standardized commits.

---

## 3. Parallelization Strategy

When implementing features, maximize parallel work:

- **Independent components** (e.g., list view + editor form) can be written in parallel
- **Server actions** should be written first — components depend on their types
- **Pages** depend on components — create them last
- **Quality gate** runs after all code is written
- **Rules/docs** are independent from code — write them in parallel with implementation

Use Task tool with `run_in_background` for truly independent research. Use sequential execution when there are data dependencies.

---

## 4. Agent Usage

| Agent | When to Use |
|-------|-------------|
| `feature-component` | Creating new React components (enforces project conventions) |
| `server-action` | Creating Server Actions with Supabase (enforces RLS, typing, German errors) |
| `verify` | Running quality gate after implementation |
| `Explore` (built-in) | Deep codebase research before planning a feature |

---

## 5. Supabase Type Workaround

The auto-generated `Database` types resolve to `never` for query results. Use these patterns:

```ts
// SELECT — cast the final result
const { data } = await supabase.from('table').select('*').eq('id', id).single();
return data as TableRow;

// INSERT/UPDATE — cast .from() as any, then cast result
const { data, error } = (await (supabase.from('table') as any)
  .insert({ ... })
  .select('id')
  .single()) as { data: { id: string } | null; error: { message: string; code: string } | null };
```

Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` before `as any` casts.

---

## 6. PRD Tracking

After completing a feature:
1. Update `PRD.md` — move the item from "Offen" to "Erledigt" with commit hash
2. Update "Bekannte Issues" if new issues were discovered
3. Use `/next-step` skill to identify the next feature

---

## 7. Code Review Checklist (self-check before committing)

- [ ] All UI text in German
- [ ] No `any` types (except Supabase workaround with eslint-disable)
- [ ] Loading states for all async operations
- [ ] Toast notifications on success/error
- [ ] Destructive actions have AlertDialog confirmation
- [ ] Touch targets >= 48x48px
- [ ] Responsive: works on mobile (<1024px) and desktop (>=1024px)
- [ ] Admin-only features gated with `useUserRole` hook
- [ ] No business logic in page components
- [ ] No inline styles — Tailwind only
