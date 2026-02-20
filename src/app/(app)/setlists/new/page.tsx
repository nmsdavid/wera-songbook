import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SetlistEditorForm } from '@/components/setlist/SetlistEditorForm';

export const metadata: Metadata = {
  title: 'Neue Setlist – Songbook',
};

export default function NewSetlistPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <Link
        href="/setlists"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Liste
      </Link>
      <h1 className="text-2xl font-bold">Neue Setlist</h1>
      <SetlistEditorForm mode="create" />
    </main>
  );
}
