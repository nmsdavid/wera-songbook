'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SetlistCard } from './SetlistCard';
import { useUserRole } from '@/hooks/use-user-role';
import type { EventType, Setlist } from '@/types/database';

const EVENT_TYPES: EventType[] = ['Sonntag', 'Montag', 'Event'];

interface SetlistListClientProps {
  setlists: Setlist[];
}

export function SetlistListClient({ setlists }: SetlistListClientProps) {
  const { isAdmin, loading } = useUserRole();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<EventType | null>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return setlists.filter((s) => {
      if (activeType && s.event_type !== activeType) return false;
      if (query && !s.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [setlists, search, activeType]);

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Setlists</h1>
        {!loading && isAdmin && (
          <Button asChild className="min-h-[48px]">
            <Link href="/setlists/new">
              <Plus className="mr-2 h-4 w-4" />
              Neue Setlist
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Setlist suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Event type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          variant={activeType === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveType(null)}
        >
          Alle
        </Button>
        {EVENT_TYPES.map((type) => (
          <Button
            key={type}
            variant={activeType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveType(activeType === type ? null : type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {setlists.length === 0
            ? 'Noch keine Setlists vorhanden.'
            : 'Keine Setlists gefunden.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((setlist) => (
            <SetlistCard key={setlist.id} setlist={setlist} />
          ))}
        </div>
      )}
    </div>
  );
}
