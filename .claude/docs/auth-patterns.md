# Auth Patterns

## Flow

- Supabase Auth (Email + Password), no social login
- Signup disabled — admins create users via service role
- Session: 1h access, 7d refresh

## JWT Custom Claims

```json
{ "app_metadata": { "org_id": "uuid", "department_id": "uuid", "role": "admin|leader|member" } }
```

## Client Usage

| Context | Import | Key |
|---------|--------|-----|
| Client component | `createBrowserClient` from `@/lib/supabase/client` | anon |
| Server component / Action | `createServerClient` from `@/lib/supabase/server` | anon (RLS) |
| Admin bypass | `createServiceRoleClient` from `@/lib/supabase/server` | service role |

## Helpers

```ts
// Server: getUserMembership() from '@/lib/supabase/auth-helpers'
// → { userId, email, orgId, departmentId, role } | null

// Client: useUserRole() from '@/hooks/use-user-role'
// → { user, role, isAdmin, isLeader, loading }
```

## Middleware

`src/middleware.ts` refreshes session, redirects unauthenticated → `/login`.
