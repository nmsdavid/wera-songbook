# Database Schema Reference

## Tables & Relationships

```
organizations (1) ──< departments (N)
organizations (1) ──< org_members (N) >── auth.users (1)
departments   (1) ──< org_members (N)
departments   (1) ──< songs (N)        [nullable: global if NULL]
departments   (1) ──< setlists (N)
songs         (1) ──< song_resources (N)
songs         (1) ──< setlist_songs (N)
setlists      (1) ──< setlist_songs (N)
auth.users    (1) ──< user_preferences (1)
auth.users    (1) ──< push_subscriptions (N)
```

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| songs | own org + (global OR own dept) | admin | admin | admin |
| setlists | own department | admin | admin + leader | admin |
| setlist_songs | via setlist visibility | admin + leader | admin + leader | admin + leader |
| org_members | own record | admin (own org) | admin (own org) | admin (own org) |

## Supabase Type Workaround

Generated types resolve to `never`. Use these patterns:

```ts
// SELECT with cast
const { data } = await supabase.from('songs').select('*').eq('id', id).single();
return data as Song;

// INSERT/UPDATE — cast .from() then cast result
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data, error } = (await (supabase.from('songs') as any)
  .insert({ ... })
  .select('id')
  .single()) as { data: { id: string } | null; error: ... | null };
```

Fix long-term: `supabase gen types typescript > src/types/database.ts`

## Key Constraints

- `songs.version` — increments on save (optimistic concurrency)
- `setlist_songs` — UNIQUE(setlist_id, song_id)
- `songs.department_id` — NULL = global (all departments)
- `setlists.published_at` — NULL = draft
- `updated_at` — auto-set by trigger
