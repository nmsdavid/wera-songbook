import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { SongListItem } from '@/types/database';

interface SongCardProps {
  song: SongListItem;
}

export function SongCard({ song }: SongCardProps) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 active:bg-accent"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{song.title}</p>
        {song.artist && (
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {song.original_key && (
          <span className="font-mono text-sm font-bold text-primary">
            {song.original_key}
          </span>
        )}
        <Badge variant="secondary">{song.category}</Badge>
      </div>
    </Link>
  );
}
