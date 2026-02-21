# API & Server Action Conventions

## Pattern

All mutations use Server Actions (`'use server'`), not API routes.

```ts
import { createServerClient } from '@/lib/supabase/server';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import type { ActionResult } from '@/lib/actions/types';

export async function myAction(input): Promise<ActionResult<Output>> {
  // 1. Validate → return error if invalid
  // 2. Get supabase + membership
  // 3. DB operation (RLS enforces auth)
  // 4. revalidatePath() on success
  // 5. Return { success, data } or { success: false, error: 'German msg' }
}
```

## ActionResult Type (`src/lib/actions/types.ts`)

```ts
ActionResult<T> = { success: true; data: T } | { success: true } | { success: false; error: string }
```

## Error Handling

- `console.error()` for logging, German user message in return
- `'CONFLICT'` sentinel for optimistic concurrency failures
- Never expose DB errors to users

## File Structure

```
src/lib/<domain>/actions.ts      — Server Actions
src/lib/actions/types.ts         — Shared ActionResult
src/lib/supabase/auth-helpers.ts — getUserMembership()
```
