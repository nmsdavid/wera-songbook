'use client';

import Link from 'next/link';
import { Calendar, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Setlist } from '@/types/database';

interface SetlistCardProps {
  setlist: Setlist;
}

const eventTypeLabels: Record<string, string> = {
  Sonntag: 'Sonntag',
  Montag: 'Montag',
  Event: 'Event',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function SetlistCard({ setlist }: SetlistCardProps) {
  const isDraft = !setlist.published_at;

  return (
    <Link href={`/setlists/${setlist.id}`}>
      <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{setlist.title}</p>
            {isDraft && (
              <Badge variant="outline" className="text-xs">Entwurf</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(setlist.date)}</span>
            <Badge variant="secondary" className="text-xs">
              {eventTypeLabels[setlist.event_type] ?? setlist.event_type}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
