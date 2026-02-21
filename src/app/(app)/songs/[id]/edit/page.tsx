import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSongForEdit } from '@/lib/songs/actions';
import { SongEditorForm } from '@/components/songs/SongEditorForm';

interface EditSongPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditSongPageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await getSongForEdit(id);
  return {
    title: song ? `${song.title} bearbeiten – Songbook` : 'Song nicht gefunden – Songbook',
  };
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  const { id } = await params;
  const song = await getSongForEdit(id);

  if (!song) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <div className="py-12 text-center">
          <p className="text-lg font-medium">Song nicht gefunden.</p>
          <a
            href="/songs"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Zurück zur Song-Liste
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <Link
        href={`/songs/${song.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Song
      </Link>
      <h1 className="text-2xl font-bold">{song.title} bearbeiten</h1>
      <SongEditorForm mode="edit" song={song} />
    </main>
  );
}
