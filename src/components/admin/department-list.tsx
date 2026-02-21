'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/lib/admin/actions';
import type { Department } from '@/types/database';

interface DepartmentListProps {
  departments: (Department & { memberCount: number })[];
}

export function DepartmentList({ departments }: DepartmentListProps) {
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<(Department & { memberCount: number }) | null>(null);

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createDepartment(newName.trim());
      if (result.success) {
        toast.success('Abteilung erstellt');
        setNewName('');
        setCreateOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleUpdate() {
    if (!editTarget || !editName.trim()) return;
    startTransition(async () => {
      const result = await updateDepartment(editTarget.id, editName.trim());
      if (result.success) {
        toast.success('Abteilung aktualisiert');
        setEditTarget(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteDepartment(deleteTarget.id);
      if (result.success) {
        toast.success('Abteilung gelöscht');
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Abteilungen</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[48px] min-w-[48px]">
              <Plus className="mr-2 h-4 w-4" />
              Neue Abteilung
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Abteilung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deptName">Name</Label>
                <Input
                  id="deptName"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="z.B. Hauptgemeinde"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={isPending || !newName.trim()} className="w-full min-h-[48px]">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {departments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Keine Abteilungen vorhanden.
        </p>
      ) : (
        <div className="space-y-2">
          {departments.map(dept => (
            <div
              key={dept.id}
              className="flex items-center justify-between rounded-lg border p-3 gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{dept.name}</p>
                <Badge variant="outline" className="mt-1">
                  <Users className="mr-1 h-3 w-3" />
                  {dept.memberCount} {dept.memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[48px] min-w-[48px]"
                  onClick={() => {
                    setEditTarget(dept);
                    setEditName(dept.name);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[48px] min-w-[48px] text-destructive"
                  onClick={() => setDeleteTarget(dept)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Department */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abteilung bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDeptName">Name</Label>
              <Input
                id="editDeptName"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUpdate()}
              />
            </div>
            <Button onClick={handleUpdate} disabled={isPending || !editName.trim()} className="w-full min-h-[48px]">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abteilung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; wird gelöscht.
              {deleteTarget && deleteTarget.memberCount > 0
                ? ` Diese Abteilung hat noch ${deleteTarget.memberCount} Mitglieder und kann nicht gelöscht werden.`
                : ' Diese Aktion kann nicht rückgängig gemacht werden.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending || (deleteTarget?.memberCount ?? 0) > 0}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
