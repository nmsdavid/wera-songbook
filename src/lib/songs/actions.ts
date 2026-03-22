'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import type { ActionResult } from '@/lib/actions/types';
import type { Song, SongCategory } from '@/types/database';

// ----- Types -----

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
  if (data.title.length > 200) return 'Titel darf maximal 200 Zeichen lang sein.';
  if (!data.content.trim()) return 'Song-Inhalt (ChordPro) darf nicht leer sein.';
  if (data.content.length > 50000) return 'Song-Inhalt ist zu lang (max. 50.000 Zeichen).';
  if (data.artist && data.artist.length > 200) return 'Interpret darf maximal 200 Zeichen lang sein.';
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
  const membership = await getUserMembership(supabase);
  if (!membership) return { success: false, error: 'Nicht angemeldet.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('songs') as any)
    .insert({
      org_id: membership.orgId,
      department_id: formData.department_id,
      title: formData.title.trim(),
      artist: formData.artist?.trim() || null,
      original_key: formData.original_key?.trim() || null,
      tempo: formData.tempo,
      category: formData.category,
      tags: formData.tags,
      content: formData.content,
      created_by: membership.userId,
      updated_by: membership.userId,
    })
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string; code: string } | null };

  if (error || !data) {
    console.error('createSong failed');
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
  const membership = await getUserMembership(supabase);
  if (!membership || membership.role !== 'admin') {
    return { success: false, error: 'Keine Berechtigung.' };
  }

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
      updated_by: membership.userId,
    })
    .eq('id', songId)
    .eq('version', version)
    .select('version')
    .single()) as { data: { version: number } | null; error: { message: string; code: string } | null };

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'CONFLICT' };
    }
    console.error('updateSong failed');
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
  const membership = await getUserMembership(supabase);
  if (!membership || membership.role !== 'admin') {
    return { success: false, error: 'Keine Berechtigung.' };
  }

  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId);

  if (error) {
    console.error('deleteSong failed');
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
