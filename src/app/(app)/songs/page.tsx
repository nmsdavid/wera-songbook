import { createServerClient } from '@/lib/supabase/server';
import { SongListClient } from '@/components/songs/SongListClient';
import { CreateSongButton } from '@/components/songs/SongActions';
import type { SongListItem } from '@/types/database';

export const metadata = {
  title: 'Songs – Songbook',
};

export default async function SongsPage() {
  const supabase = await createServerClient();

  const { data: songs } = await supabase
    .from('songs')
    .select('id, org_id, department_id, title, artist, original_key, tempo, category, tags, created_at, updated_at')
    .order('title', { ascending: true });

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Songs</h1>
        <CreateSongButton />
      </div>
      <SongListClient songs={(songs ?? []) as SongListItem[]} />
    </main>
  );
}
