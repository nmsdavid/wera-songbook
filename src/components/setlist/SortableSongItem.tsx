'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableSongItemProps {
  song: {
    id: string;
    title: string;
    artist: string | null;
    original_key: string | null;
    tempo: number | null;
  };
  index: number;
  onRemove: () => void;
}

export function SortableSongItem({ song, index, onRemove }: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-background px-3 py-2 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
        aria-label="Reihenfolge ändern"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="shrink-0 text-sm text-muted-foreground">{index + 1}.</span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        {song.artist && (
          <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {song.original_key && (
          <span className="font-mono font-bold">{song.original_key}</span>
        )}
        {song.tempo && <span>{song.tempo} BPM</span>}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0 min-h-[48px] min-w-[48px]"
        aria-label="Song entfernen"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
