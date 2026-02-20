import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Song } from '@/types/database';

interface SongDetailHeaderProps {
  song: Song;
}

export function SongDetailHeader({ song }: SongDetailHeaderProps) {
  return (
    <div className="space-y-3">
      <Link
        href="/songs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Liste
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{song.title}</h1>
        {song.artist && (
          <p className="text-muted-foreground">{song.artist}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {song.original_key && (
          <span>
            <span className="text-muted-foreground">Tonart: </span>
            <span className="font-mono font-bold">{song.original_key}</span>
          </span>
        )}
        {song.tempo && (
          <span>
            <span className="text-muted-foreground">Tempo: </span>
            <span className="font-bold">{song.tempo} BPM</span>
          </span>
        )}
        <Badge variant="secondary">{song.category}</Badge>
        {song.tags.map((tag) => (
          <Badge key={tag} variant="outline">{tag}</Badge>
        ))}
      </div>

      <Separator />
    </div>
  );
}
