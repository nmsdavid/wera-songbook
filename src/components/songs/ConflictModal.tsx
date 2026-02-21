'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConflictModalProps {
  open: boolean;
  onKeepMine: () => void;
  onTakeTheirs: () => void;
  onCancel: () => void;
}

export function ConflictModal({ open, onKeepMine, onTakeTheirs, onCancel }: ConflictModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konflikt erkannt</AlertDialogTitle>
          <AlertDialogDescription>
            Dieser Song wurde in der Zwischenzeit von jemand anderem bearbeitet.
            Wie möchtest du fortfahren?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onTakeTheirs} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Neue Version übernehmen
          </AlertDialogAction>
          <AlertDialogAction onClick={onKeepMine}>
            Meine Version behalten
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
