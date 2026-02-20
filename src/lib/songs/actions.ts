'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import type { Song, SongCategory } from '@/types/database';

// ----- Types -----

type ActionSuccess<T = undefined> = T extends undefined
  ? { success: true }
  : { success: true; data: T };

type ActionError = { success: false; error: string };

type ActionResult<T = undefined> = ActionSuccess<T> | ActionError;

export type SongFormData = {
  title: string;
  artist: string | null;
  original_key: string | null;
  tempo: number | null;
  category: SongCategory;
  tags: string[];
  content: string;
  department_id: string | null;
};

// ----- Helpers -----

function validateSongForm(data: SongFormData): string | null {
  if (!data.title.trim()) return 'Titel darf nicht leer sein.';
  if (!data.content.trim()) return 'Song-Inhalt (ChordPro) darf nicht leer sein.';
  if (data.tempo !== null && (data.tempo < 1 || data.tempo > 300)) {
    return 'Tempo muss zwischen 1 und 300 BPM liegen.';
  }
  return null;
}

// ----- Actions -----

export async function createSong(
  formData: SongFormData,
): Promise<ActionResult<{ id: string }>> {
  const validationError = validateSongForm(formData);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createServerClient();

  // Get current user's org_id from membership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet.' };

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1) as { data: Array<{ org_id: string }> | null };

  const orgId = membership?.[0]?.org_id;
  if (!orgId) return { success: false, error: 'Keine Organisation zugewiesen.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('songs') as any)
    .insert({
      org_id: orgId,
      department_id: formData.department_id,
      title: formData.title.trim(),
      artist: formData.artist?.trim() || null,
      original_key: formData.original_key?.trim() || null,
      tempo: formData.tempo,
      category: formData.category,
      tags: formData.tags,
      content: formData.content,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string; code: string } | null };

  if (error || !data) {
    console.error('createSong error:', error);
    return { success: false, error: 'Song konnte nicht erstellt werden.' };
  }

  revalidatePath('/songs');
  return { success: true, data: { id: data.id } };
}

export async function updateSong(
  songId: string,
  version: number,
  formData: SongFormData,
): Promise<ActionResult<{ version: number }>> {
  const validationError = validateSongForm(formData);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet.' };

  // Optimistic concurrency: only update if version matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('songs') as any)
    .update({
      title: formData.title.trim(),
      artist: formData.artist?.trim() || null,
      original_key: formData.original_key?.trim() || null,
      tempo: formData.tempo,
      category: formData.category,
      tags: formData.tags,
      content: formData.content,
      department_id: formData.department_id,
      version: version + 1,
      updated_by: user.id,
    })
    .eq('id', songId)
    .eq('version', version)
    .select('version')
    .single()) as { data: { version: number } | null; error: { message: string; code: string } | null };

  if (error) {
    // If no rows matched, it's a version conflict
    if (error.code === 'PGRST116') {
      return { success: false, error: 'CONFLICT' };
    }
    console.error('updateSong error:', error);
    return { success: false, error: 'Song konnte nicht gespeichert werden.' };
  }

  if (!data) {
    return { success: false, error: 'CONFLICT' };
  }

  revalidatePath('/songs');
  revalidatePath(`/songs/${songId}`);
  return { success: true, data: { version: data.version } };
}

export async function deleteSong(songId: string): Promise<ActionResult> {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet.' };

  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId);

  if (error) {
    console.error('deleteSong error:', error);
    return { success: false, error: 'Song konnte nicht gelöscht werden.' };
  }

  revalidatePath('/songs');
  return { success: true };
}

export async function getSongForEdit(songId: string): Promise<Song | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', songId)
    .single();

  if (error || !data) return null;
  return data as Song;
}
