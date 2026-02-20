'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SongCard } from '@/components/songs/SongCard';
import type { SongCategory, SongListItem } from '@/types/database';

const CATEGORIES: SongCategory[] = [
  'Lobpreis',
  'Anbetung',
  'Rock',
  'Pop',
  'Ballade',
  'Sonstiges',
];

interface SongListClientProps {
  songs: SongListItem[];
}

export function SongListClient({ songs }: SongListClientProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<SongCategory | null>(null);

  const filteredSongs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return songs.filter((song) => {
      // Category filter
      if (activeCategory && song.category !== activeCategory) return false;

      // Search filter
      if (query) {
        const haystack = [
          song.title,
          song.artist ?? '',
          ...song.tags,
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      }

      return true;
    });
  }, [songs, search, activeCategory]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Song suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          Alle
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Song list */}
      {filteredSongs.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {songs.length === 0
            ? 'Noch keine Songs vorhanden.'
            : 'Keine Songs gefunden.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}
