'use client';

import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/use-user-role';

interface SongEditButtonProps {
  songId: string;
}

export function SongEditButton({ songId }: SongEditButtonProps) {
  const { isAdmin, loading } = useUserRole();

  if (loading || !isAdmin) return null;

  return (
    <Button asChild variant="outline" className="min-h-[48px]">
      <Link href={`/songs/${songId}/edit`}>
        <Pencil className="mr-2 h-4 w-4" />
        Bearbeiten
      </Link>
    </Button>
  );
}

export function CreateSongButton() {
  const { isAdmin, loading } = useUserRole();

  if (loading || !isAdmin) return null;

  return (
    <Button asChild className="min-h-[48px]">
      <Link href="/songs/new">
        <Plus className="mr-2 h-4 w-4" />
        Neuer Song
      </Link>
    </Button>
  );
}
