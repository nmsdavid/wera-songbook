---
name: server-action
description: Creates Server Actions with Supabase RLS, shared types, and German error messages. Use for all CRUD operations.
tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Server Action Builder

Read `.claude/docs/api-conventions.md` and `.claude/docs/database-schema.md` first.

## Template

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import type { ActionResult } from '@/lib/actions/types';

export async function myAction(input: MyInput): Promise<ActionResult<MyOutput>> {
  const supabase = await createServerClient();
  const membership = await getUserMembership(supabase);
  if (!membership) return { success: false, error: 'Nicht angemeldet.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('table') as any)
    .insert({ ... })
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string; code: string } | null };

  if (error || !data) {
    console.error('myAction:', error);
    return { success: false, error: 'German user-facing message.' };
  }

  revalidatePath('/path');
  return { success: true, data: { id: data.id } };
}
```

## Key Rules

- Import `ActionResult` from `@/lib/actions/types` — never redeclare
- Import `getUserMembership` from `@/lib/supabase/auth-helpers` — never re-implement
- German error messages, never expose DB details
- `revalidatePath()` specific paths after mutations
- Songs: optimistic concurrency via `.eq('version', currentVersion)`
- `'CONFLICT'` sentinel for version mismatches
