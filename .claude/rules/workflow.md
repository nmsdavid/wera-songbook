# Workflow Rules — WERA Songbook

## 1. Quality Gate (before every commit)

```bash
npm run typecheck && npm run lint && npm run build
```

Use `/verify` skill. Never commit failing code.

## 2. Commits

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`
- English messages, 1-3 sentence body
- `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Stage specific files, never `git add -A`
- Never commit `.env*`, credentials
- Work on `develop`. Never force-push. Confirm before `main`.
- Use `/commit-push` skill.

## 3. Implementation Order

1. Server Actions first (components depend on types)
2. Components in parallel (list + editor are independent)
3. Pages last (depend on components)
4. Quality gate after all code
5. Docs/rules in parallel with code

## 4. Agents

| Agent | Purpose |
|-------|---------|
| `feature-component` | React components (conventions enforced) |
| `server-action` | CRUD Server Actions (shared types, RLS) |
| `page-builder` | Next.js pages (server data, loading, 404) |
| `verify` | Quality gate (typecheck + lint + build) |

## 5. Skills

| Skill | Purpose |
|-------|---------|
| `/verify` | Run quality gate |
| `/commit-push` | Stage, commit, push |
| `/next-step` | Plan next PRD feature |

## 6. Shared Code (DRY)

| Module | What |
|--------|------|
| `src/lib/actions/types.ts` | `ActionResult<T>` — import, never redeclare |
| `src/lib/supabase/auth-helpers.ts` | `getUserMembership()` — import, never re-implement |
| `@/hooks/use-user-role` | Client-side role check |

See `.claude/docs/database-schema.md` for Supabase type workaround patterns.

## 7. Definition of Done

- [ ] German UI text
- [ ] No `any` (except Supabase workaround with eslint-disable)
- [ ] Loading states for async ops
- [ ] Toast on success/error
- [ ] AlertDialog for destructive actions
- [ ] Touch targets >= 48x48px
- [ ] Responsive (mobile < 1024px, desktop >= 1024px)
- [ ] Role-gated features (`useUserRole`)
- [ ] No business logic in pages
- [ ] Tailwind only
- [ ] PRD.md updated after completion
