'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSongsForPicker } from '@/lib/setlists/actions';

type PickerSong = {
  id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  tempo: number | null;
  category: string;
};

interface SongPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (song: PickerSong) => void;
  excludeSongIds: string[];
}

export function SongPickerDialog({
  open,
  onOpenChange,
  onSelect,
  excludeSongIds,
}: SongPickerDialogProps) {
  const [allSongs, setAllSongs] = useState<PickerSong[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && allSongs.length === 0) {
      setLoading(true);
      getSongsForPicker().then((songs) => {
        setAllSongs(songs);
        setLoading(false);
      });
    }
  }, [open, allSongs.length]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return allSongs.filter((s) => {
      if (excludeSongIds.includes(s.id)) return false;
      if (query) {
        const haystack = [s.title, s.artist ?? ''].join(' ').toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [allSongs, search, excludeSongIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Song hinzufügen</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Song suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Lade Songs…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {allSongs.length === 0 ? 'Keine Songs vorhanden.' : 'Keine Songs gefunden.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((song) => (
                <Button
                  key={song.id}
                  variant="ghost"
                  className="w-full justify-start min-h-[48px] px-3"
                  onClick={() => onSelect(song)}
                >
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[song.artist, song.original_key, song.tempo ? `${song.tempo} BPM` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
