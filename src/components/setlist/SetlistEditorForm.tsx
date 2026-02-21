'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Loader2, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortableSongItem } from './SortableSongItem';
import { SongPickerDialog } from './SongPickerDialog';
import {
  createSetlist,
  updateSetlist,
  updateSetlistSongs,
} from '@/lib/setlists/actions';
import type { SetlistFormData, SetlistSongWithDetails } from '@/lib/setlists/actions';
import type { EventType, Setlist } from '@/types/database';

const EVENT_TYPES: EventType[] = ['Sonntag', 'Montag', 'Event'];

type EditorSong = {
  id: string;
  song_id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  tempo: number | null;
  note: string | null;
};

interface SetlistEditorFormProps {
  setlist?: Setlist;
  existingSongs?: SetlistSongWithDetails[];
  mode: 'create' | 'edit';
}

export function SetlistEditorForm({ setlist, existingSongs = [], mode }: SetlistEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState(setlist?.title ?? '');
  const [date, setDate] = useState(setlist?.date ?? '');
  const [eventType, setEventType] = useState<EventType>(setlist?.event_type ?? 'Sonntag');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Songs state
  const [songs, setSongs] = useState<EditorSong[]>(
    existingSongs.map((s) => ({
      id: s.id,
      song_id: s.song_id,
      title: s.song.title,
      artist: s.song.artist,
      original_key: s.song.original_key,
      tempo: s.song.tempo,
      note: s.note,
    })),
  );

  // Song picker
  const [pickerOpen, setPickerOpen] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSongs((items) => {
        const oldIndex = items.findIndex((s) => s.id === active.id);
        const newIndex = items.findIndex((s) => s.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleAddSong(song: { id: string; title: string; artist: string | null; original_key: string | null; tempo: number | null }) {
    // Don't add duplicates
    if (songs.some((s) => s.song_id === song.id)) {
      toast.error('Song ist bereits in der Setlist.');
      return;
    }
    setSongs((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${song.id}`,
        song_id: song.id,
        title: song.title,
        artist: song.artist,
        original_key: song.original_key,
        tempo: song.tempo,
        note: null,
      },
    ]);
    setPickerOpen(false);
  }

  function handleRemoveSong(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Titel ist erforderlich.';
    if (!date) newErrors.date = 'Datum ist erforderlich.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, date]);

  function handleSave() {
    if (!validate()) return;

    const formData: SetlistFormData = {
      title: title.trim(),
      date,
      event_type: eventType,
    };

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createSetlist(formData);
        if (result.success) {
          // Save songs if any were added
          if (songs.length > 0) {
            await updateSetlistSongs(
              result.data.id,
              songs.map((s, i) => ({ song_id: s.song_id, position: i, note: s.note })),
            );
          }
          toast.success('Setlist erstellt');
          router.push(`/setlists/${result.data.id}`);
        } else {
          toast.error(result.error);
        }
      } else {
        const [setlistResult, songsResult] = await Promise.all([
          updateSetlist(setlist!.id, formData),
          updateSetlistSongs(
            setlist!.id,
            songs.map((s, i) => ({ song_id: s.song_id, position: i, note: s.note })),
          ),
        ]);

        if (setlistResult.success && songsResult.success) {
          toast.success('Setlist gespeichert');
          router.push(`/setlists/${setlist!.id}`);
        } else {
          const errorMsg = !setlistResult.success
            ? setlistResult.error
            : !songsResult.success
              ? songsResult.error
              : 'Unbekannter Fehler';
          toast.error(errorMsg);
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="min-h-[48px]"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {mode === 'create' ? 'Erstellen' : 'Speichern'}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="min-h-[48px]"
        >
          Abbrechen
        </Button>
      </div>

      {/* Form fields */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
            placeholder="z.B. Gottesdienst 23.02."
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: '' })); }}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Typ</Label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Songs section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Songs ({songs.length})</h2>
          <Button
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="min-h-[48px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Song hinzufügen
          </Button>
        </div>

        {songs.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
            Noch keine Songs. Klicke &ldquo;Song hinzufügen&rdquo; um zu beginnen.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={songs.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {songs.map((song, idx) => (
                  <SortableSongItem
                    key={song.id}
                    song={song}
                    index={idx}
                    onRemove={() => handleRemoveSong(song.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Song picker dialog */}
      <SongPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAddSong}
        excludeSongIds={songs.map((s) => s.song_id)}
      />
    </div>
  );
}
