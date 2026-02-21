'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import type { ActionResult } from '@/lib/actions/types';
import type { EventType, Setlist } from '@/types/database';

// ----- Types -----

export type SetlistFormData = {
  title: string;
  date: string;
  event_type: EventType;
};

export type SetlistSongEntry = {
  song_id: string;
  position: number;
  note: string | null;
};

export type SetlistSongWithDetails = {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  note: string | null;
  song: {
    id: string;
    title: string;
    artist: string | null;
    original_key: string | null;
    tempo: number | null;
    content: string;
    category: string;
  };
};

// ----- Helpers -----

function validateSetlistForm(data: SetlistFormData): string | null {
  if (!data.title.trim()) return 'Titel darf nicht leer sein.';
  if (!data.date) return 'Datum ist erforderlich.';
  return null;
}

// ----- Setlist CRUD -----

export async function createSetlist(
  formData: SetlistFormData,
): Promise<ActionResult<{ id: string }>> {
  const validationError = validateSetlistForm(formData);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createServerClient();
  const membership = await getUserMembership(supabase);
  if (!membership) return { success: false, error: 'Nicht angemeldet.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from('setlists') as any)
    .insert({
      org_id: membership.orgId,
      department_id: membership.departmentId,
      title: formData.title.trim(),
      date: formData.date,
      event_type: formData.event_type,
      created_by: membership.userId,
    })
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string; code: string } | null };

  if (error || !data) {
    console.error('createSetlist error:', error);
    return { success: false, error: 'Setlist konnte nicht erstellt werden.' };
  }

  revalidatePath('/setlists');
  return { success: true, data: { id: data.id } };
}

export async function updateSetlist(
  setlistId: string,
  formData: SetlistFormData,
): Promise<ActionResult> {
  const validationError = validateSetlistForm(formData);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (supabase.from('setlists') as any)
    .update({
      title: formData.title.trim(),
      date: formData.date,
      event_type: formData.event_type,
    })
    .eq('id', setlistId)) as { error: { message: string } | null };

  if (error) {
    console.error('updateSetlist error:', error);
    return { success: false, error: 'Setlist konnte nicht gespeichert werden.' };
  }

  revalidatePath('/setlists');
  revalidatePath(`/setlists/${setlistId}`);
  return { success: true };
}

export async function deleteSetlist(setlistId: string): Promise<ActionResult> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('setlists')
    .delete()
    .eq('id', setlistId);

  if (error) {
    console.error('deleteSetlist error:', error);
    return { success: false, error: 'Setlist konnte nicht gelöscht werden.' };
  }

  revalidatePath('/setlists');
  return { success: true };
}

export async function publishSetlist(setlistId: string): Promise<ActionResult> {
  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (supabase.from('setlists') as any)
    .update({ published_at: new Date().toISOString() })
    .eq('id', setlistId)) as { error: { message: string } | null };

  if (error) {
    console.error('publishSetlist error:', error);
    return { success: false, error: 'Setlist konnte nicht veröffentlicht werden.' };
  }

  revalidatePath('/setlists');
  revalidatePath(`/setlists/${setlistId}`);
  return { success: true };
}

// ----- Setlist Songs -----

export async function updateSetlistSongs(
  setlistId: string,
  songs: SetlistSongEntry[],
): Promise<ActionResult> {
  const supabase = await createServerClient();

  const { error: deleteError } = await supabase
    .from('setlist_songs')
    .delete()
    .eq('setlist_id', setlistId);

  if (deleteError) {
    console.error('updateSetlistSongs delete error:', deleteError);
    return { success: false, error: 'Songs konnten nicht aktualisiert werden.' };
  }

  if (songs.length > 0) {
    const rows = songs.map((s) => ({
      setlist_id: setlistId,
      song_id: s.song_id,
      position: s.position,
      note: s.note,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = (await (supabase.from('setlist_songs') as any)
      .insert(rows)) as { error: { message: string } | null };

    if (insertError) {
      console.error('updateSetlistSongs insert error:', insertError);
      return { success: false, error: 'Songs konnten nicht aktualisiert werden.' };
    }
  }

  revalidatePath(`/setlists/${setlistId}`);
  return { success: true };
}

// ----- Data Fetching -----

export async function getSetlistsForList(): Promise<Setlist[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('setlists')
    .select('*')
    .order('date', { ascending: false });
  return (data ?? []) as Setlist[];
}

export async function getSetlistWithSongs(setlistId: string) {
  const supabase = await createServerClient();

  const { data: setlist } = await supabase
    .from('setlists')
    .select('*')
    .eq('id', setlistId)
    .single();

  if (!setlist) return null;

  const { data: setlistSongs } = await supabase
    .from('setlist_songs')
    .select('id, setlist_id, song_id, position, note, song:songs(id, title, artist, original_key, tempo, content, category)')
    .eq('setlist_id', setlistId)
    .order('position', { ascending: true });

  return {
    setlist: setlist as Setlist,
    songs: (setlistSongs ?? []) as unknown as SetlistSongWithDetails[],
  };
}

export async function getSongsForPicker() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('songs')
    .select('id, title, artist, original_key, tempo, category')
    .order('title', { ascending: true });
  return (data ?? []) as Array<{
    id: string;
    title: string;
    artist: string | null;
    original_key: string | null;
    tempo: number | null;
    category: string;
  }>;
}
