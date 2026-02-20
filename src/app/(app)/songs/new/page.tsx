import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SongEditorForm } from '@/components/songs/SongEditorForm';

export const metadata: Metadata = {
  title: 'Neuer Song – Songbook',
};

export default function NewSongPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <Link
        href="/songs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Liste
      </Link>
      <h1 className="text-2xl font-bold">Neuer Song</h1>
      <SongEditorForm mode="create" />
    </main>
  );
}
