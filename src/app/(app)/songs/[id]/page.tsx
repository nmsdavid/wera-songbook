import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { SongDetailHeader } from '@/components/songs/SongDetailHeader';
import { ChordSheet } from '@/components/chord-sheet/ChordSheet';
import { SongEditButton } from '@/components/songs/SongActions';
import type { Song } from '@/types/database';

interface SongDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getSong(id: string): Promise<Song | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function generateMetadata({ params }: SongDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    return { title: 'Song nicht gefunden – Songbook' };
  }

  return {
    title: `${song.title}${song.artist ? ` – ${song.artist}` : ''} – Songbook`,
  };
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { id } = await params;
  const song = await getSong(id);

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
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <SongDetailHeader song={song} />
        <SongEditButton songId={song.id} />
      </div>
      <ChordSheet content={song.content} originalKey={song.original_key} />
    </main>
  );
}
