import { createBrowserClient } from '@/lib/supabase/client';
import { cacheSetlistWithSongs, setMeta } from './db';
import type { Setlist, SetlistSong, Song } from '@/types/database';

/**
 * Cache the next 3 upcoming setlists and their songs to IndexedDB.
 * Called on app load and after setlist updates.
 */
export async function syncUpcomingSetlists() {
  try {
    const supabase = createBrowserClient();
    const today = new Date().toISOString().split('T')[0];

    // Get next 3 setlists by date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: setlists } = (await (supabase.from('setlists') as any)
      .select('*')
      .gte('date', today)
      .not('published_at', 'is', null)
      .order('date', { ascending: true })
      .limit(3)) as { data: Setlist[] | null };

    if (!setlists || setlists.length === 0) return;

    for (const setlist of setlists) {
      // Get songs in this setlist with full song data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: setlistSongs } = (await (supabase.from('setlist_songs') as any)
        .select('*, song:songs(*)')
        .eq('setlist_id', setlist.id)
        .order('position', { ascending: true })) as {
        data: (SetlistSong & { song: Song })[] | null;
      };

      if (setlistSongs) {
        await cacheSetlistWithSongs(setlist, setlistSongs);
      }
    }

    await setMeta('lastSync', new Date().toISOString());
  } catch (error) {
    console.error('Offline sync failed');
  }
}
