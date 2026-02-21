---
name: page-builder
description: Creates Next.js App Router pages with server-side data fetching, loading states, and error handling. Use when adding new routes.
tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# Page Builder

Creates Next.js App Router pages following WERA Songbook patterns.

## Page Template (Server Component)

```tsx
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Seitentitel – Songbook' };

export default async function MyPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.from('table').select('*');
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <ClientComponent data={(data ?? []) as MyType[]} />
    </main>
  );
}
```

## Dynamic Page Template

```tsx
interface PageProps { params: Promise<{ id: string }>; }

export default async function DetailPage({ params }: PageProps) {
  const { id } = await params;
  // fetch, 404 handling, render
}
```

## Required Files Per Route

| File | Purpose |
|------|---------|
| `page.tsx` | Main page (server component) |
| `loading.tsx` | Skeleton loader (Skeleton components) |

## Rules

- Server components for data fetching — pass to client components as props
- Cast Supabase results: `as MyType[]` (see `.claude/docs/database-schema.md`)
- Max container width: `max-w-2xl` (list), `max-w-4xl` (detail), `max-w-3xl` (editor), `max-w-5xl` (split-view)
- Back links: `<Link>` with `<ArrowLeft>` icon
- 404: centered message + "Zurück" link
- German metadata titles
