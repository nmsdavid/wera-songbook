'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChordSheet } from '@/components/chord-sheet/ChordSheet';
import { ConflictModal } from '@/components/songs/ConflictModal';
import { PresenceBanner } from '@/components/songs/PresenceBanner';
import { DeleteSongDialog } from '@/components/songs/DeleteSongDialog';
import { createSong, updateSong, deleteSong } from '@/lib/songs/actions';
import type { SongFormData } from '@/lib/songs/actions';
import type { Song, SongCategory } from '@/types/database';

const CATEGORIES: SongCategory[] = ['Lobpreis', 'Anbetung', 'Sonstiges'];

// Suggested tags (genre, themes, …). Users can add their own via the input.
const AVAILABLE_TAGS = [
  'Rock', 'Pop', 'Ballade', 'Modern', 'Klassisch',
  'Heilung', 'Gebet', 'Wunder', 'Advent', 'Ostern', 'Pfingsten',
  'Ernte', 'Glaube', 'Hoffnung', 'Freude',
];

function normalizeCategory(value: string | undefined): SongCategory {
  return CATEGORIES.includes(value as SongCategory)
    ? (value as SongCategory)
    : 'Sonstiges';
}

interface SongEditorFormProps {
  song?: Song;
  mode: 'create' | 'edit';
}

export function SongEditorForm({ song, mode }: SongEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState(song?.title ?? '');
  const [artist, setArtist] = useState(song?.artist ?? '');
  const [originalKey, setOriginalKey] = useState(song?.original_key ?? '');
  const [tempo, setTempo] = useState(song?.tempo?.toString() ?? '');
  const [category, setCategory] = useState<SongCategory>(normalizeCategory(song?.category));
  const [tags, setTags] = useState<string[]>(song?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [content, setContent] = useState(song?.content ?? '');
  const [version, setVersion] = useState(song?.version ?? 1);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Conflict state
  const [showConflict, setShowConflict] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Titel ist erforderlich.';
    if (!content.trim()) newErrors.content = 'Song-Inhalt ist erforderlich.';
    if (tempo && (Number(tempo) < 1 || Number(tempo) > 300 || isNaN(Number(tempo)))) {
      newErrors.tempo = 'Tempo muss zwischen 1 und 300 liegen.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content, tempo]);

  const formData = useMemo((): SongFormData => ({
    title: title.trim(),
    artist: artist.trim() || null,
    original_key: originalKey.trim() || null,
    tempo: tempo ? Number(tempo) : null,
    category,
    tags,
    content,
    department_id: song?.department_id ?? null,
  }), [title, artist, originalKey, tempo, category, tags, content, song?.department_id]);

  function handleSave() {
    if (!validate()) return;

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createSong(formData);
        if (result.success) {
          toast.success('Song erstellt');
          router.push(`/songs/${result.data.id}`);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await updateSong(song!.id, version, formData);
        if (result.success) {
          setVersion(result.data.version);
          toast.success('Song gespeichert');
          router.push(`/songs/${song!.id}`);
        } else if (result.error === 'CONFLICT') {
          setShowConflict(true);
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSong(song!.id);
      if (result.success) {
        toast.success('Song gelöscht');
        router.push('/songs');
      } else {
        toast.error(result.error);
      }
    });
  }

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    // Duplicate check (case-insensitive)
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setTagError(`„${tag}" ist bereits vorhanden.`);
      return;
    }
    setTags((prev) => [...prev, tag]);
    setTagInput('');
    setTagError('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleConflictKeepMine() {
    // Force save with latest version
    const supabase = (await import('@/lib/supabase/client')).createBrowserClient();
    const { data: latestSong } = (await supabase
      .from('songs')
      .select('version')
      .eq('id', song!.id)
      .single()) as { data: { version: number } | null };

    if (latestSong) {
      setVersion(latestSong.version);
      setShowConflict(false);
      // Re-trigger save with new version
      startTransition(async () => {
        const result = await updateSong(song!.id, latestSong.version, formData);
        if (result.success) {
          setVersion(result.data.version);
          toast.success('Song gespeichert');
          router.push(`/songs/${song!.id}`);
        } else {
          toast.error(result.error);
        }
      });
    }
  }

  function handleConflictTakeTheirs() {
    setShowConflict(false);
    router.refresh();
    toast.info('Seite wurde neu geladen');
  }

  // Form fields (shared between desktop and mobile)
  const formFields = (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
          placeholder="Song-Titel"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      {/* Artist */}
      <div className="space-y-1.5">
        <Label htmlFor="artist">Interpret</Label>
        <Input
          id="artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Interpret / Autor"
        />
      </div>

      {/* Key + Tempo row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="originalKey">Tonart</Label>
          <Input
            id="originalKey"
            value={originalKey}
            onChange={(e) => setOriginalKey(e.target.value)}
            placeholder="z.B. G"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tempo">Tempo (BPM)</Label>
          <Input
            id="tempo"
            type="number"
            value={tempo}
            onChange={(e) => { setTempo(e.target.value); setErrors((p) => ({ ...p, tempo: '' })); }}
            placeholder="z.B. 120"
            min={1}
            max={300}
          />
          {errors.tempo && <p className="text-sm text-destructive">{errors.tempo}</p>}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Kategorie</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as SongCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags (Genre, Themen …)</Label>

        {/* Selected tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="default" className="select-none gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`${tag} entfernen`}
                  className="rounded-full p-0.5 hover:bg-background/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add custom tag */}
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => { setTagInput(e.target.value); setTagError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
            }}
            placeholder="Tag hinzufügen, z.B. Rock"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addTag(tagInput)}
            aria-label="Tag hinzufügen"
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tagError && <p className="text-sm text-destructive">{tagError}</p>}

        {/* Suggestions (not yet selected) */}
        {AVAILABLE_TAGS.some((t) => !tags.some((x) => x.toLowerCase() === t.toLowerCase())) && (
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TAGS
              .filter((t) => !tags.some((x) => x.toLowerCase() === t.toLowerCase()))
              .map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer select-none"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Badge>
              ))}
          </div>
        )}
      </div>

      {/* ChordPro content */}
      <div className="space-y-1.5">
        <Label htmlFor="content">ChordPro *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: '' })); }}
          placeholder="{title: Mein Song}&#10;{key: G}&#10;&#10;[G]Amazing [D]Grace..."
          className="min-h-[300px] font-mono text-sm"
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
        <p className="text-xs text-muted-foreground">
          Akkorde in eckige Klammern direkt vor die Silbe setzen: <code className="font-mono">[G]Amazing [D]Grace</code>.
          Tonart oben angeben (oder <code className="font-mono">{'{key: G}'}</code> im Text) – nur dann funktioniert das Transponieren.
        </p>
      </div>
    </div>
  );

  // Preview
  const preview = (
    <div className="rounded-lg border p-4">
      {content.trim() ? (
        <ChordSheet content={content} originalKey={originalKey || null} />
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          Vorschau wird angezeigt, sobald du ChordPro-Inhalt eingibst.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Presence banner for edit mode */}
      {mode === 'edit' && song && <PresenceBanner songId={song.id} />}

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="min-h-[48px] min-w-[48px]"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
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
        {mode === 'edit' && song && (
          <div className="ml-auto">
            <DeleteSongDialog songTitle={song.title} onConfirm={handleDelete} isPending={isPending} />
          </div>
        )}
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div>{formFields}</div>
        <div className="sticky top-20 self-start">{preview}</div>
      </div>

      {/* Mobile: tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="editor">
          <TabsList className="w-full">
            <TabsTrigger value="editor" className="flex-1">Editor</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Vorschau</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-4">{formFields}</TabsContent>
          <TabsContent value="preview" className="mt-4">{preview}</TabsContent>
        </Tabs>
      </div>

      {/* Conflict modal */}
      <ConflictModal
        open={showConflict}
        onKeepMine={handleConflictKeepMine}
        onTakeTheirs={handleConflictTakeTheirs}
        onCancel={() => setShowConflict(false)}
      />
    </div>
  );
}
