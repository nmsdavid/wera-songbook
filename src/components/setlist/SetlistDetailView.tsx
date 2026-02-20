'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChordSheet } from '@/components/chord-sheet/ChordSheet';
import { useUserRole } from '@/hooks/use-user-role';
import { deleteSetlist, publishSetlist } from '@/lib/setlists/actions';
import type { Setlist } from '@/types/database';
import type { SetlistSongWithDetails } from '@/lib/setlists/actions';

interface SetlistDetailViewProps {
  setlist: Setlist;
  songs: SetlistSongWithDetails[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function SetlistDetailView({ setlist, songs }: SetlistDetailViewProps) {
  const router = useRouter();
  const { isAdmin, isLeader, loading: roleLoading } = useUserRole();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const canEdit = isAdmin || isLeader;
  const isDraft = !setlist.published_at;
  const currentSong = songs[currentIndex]?.song ?? null;

  function handlePublish() {
    startTransition(async () => {
      const result = await publishSetlist(setlist.id);
      if (result.success) {
        toast.success('Setlist veröffentlicht');
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSetlist(setlist.id);
      if (result.success) {
        toast.success('Setlist gelöscht');
        router.push('/setlists');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/setlists"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Liste
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{setlist.title}</h1>
            {isDraft && <Badge variant="outline">Entwurf</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(setlist.date)}
            <Badge variant="secondary">{setlist.event_type}</Badge>
          </div>
        </div>

        {/* Actions */}
        {!roleLoading && canEdit && (
          <div className="flex items-center gap-2">
            {isDraft && isAdmin && (
              <Button
                variant="outline"
                onClick={handlePublish}
                disabled={isPending}
                className="min-h-[48px]"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Veröffentlichen
              </Button>
            )}
            <Button asChild variant="outline" className="min-h-[48px]">
              <Link href={`/setlists/${setlist.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={isPending} className="min-h-[48px] min-w-[48px]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Setlist löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Möchtest du &ldquo;{setlist.title}&rdquo; wirklich löschen?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Song list sidebar + current song view */}
      {songs.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Keine Songs in dieser Setlist.
          {canEdit && ' Bearbeite die Setlist, um Songs hinzuzufügen.'}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Song list */}
          <div className="space-y-1 rounded-lg border p-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
            </p>
            {songs.map((entry, idx) => (
              <button
                key={entry.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors min-h-[48px] ${
                  idx === currentIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                <span className="font-medium">{entry.song.title}</span>
                {entry.song.original_key && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {entry.song.original_key}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Current song display */}
          <div className="space-y-4">
            {currentSong && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{currentSong.title}</h2>
                    {currentSong.artist && (
                      <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {currentSong.original_key && (
                      <span className="font-mono font-bold">{currentSong.original_key}</span>
                    )}
                    {currentSong.tempo && <span>{currentSong.tempo} BPM</span>}
                  </div>
                </div>

                <ChordSheet content={currentSong.content} originalKey={currentSong.original_key} />

                {/* Prev / Next navigation */}
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex((i) => i - 1)}
                    disabled={currentIndex === 0}
                    className="min-h-[48px]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Vorheriger
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {songs.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    disabled={currentIndex === songs.length - 1}
                    className="min-h-[48px]"
                  >
                    Nächster
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
