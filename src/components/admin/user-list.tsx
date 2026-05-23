'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ban, Loader2, MoreVertical, KeyRound, Trash2, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  blockUser,
  deleteUser,
  resetUserPassword,
  updateUserRole,
} from '@/lib/admin/actions';
import type { UserWithMembership } from '@/lib/admin/actions';
import type { AppRole, Department } from '@/types/database';

interface UserListProps {
  users: UserWithMembership[];
  departments: Department[];
  currentUserId: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  leader: 'Leiter',
  member: 'Mitglied',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  leader: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function UserList({ users, departments, currentUserId }: UserListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<UserWithMembership | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserWithMembership | null>(null);
  const [editTarget, setEditTarget] = useState<UserWithMembership | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserWithMembership | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editRole, setEditRole] = useState<AppRole>('member');
  const [editDepartment, setEditDepartment] = useState('');

  function openEdit(user: UserWithMembership) {
    setEditTarget(user);
    setEditRole(user.membership.role);
    setEditDepartment(user.membership.department_id);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id);
      if (result.success) {
        toast.success('Nutzer gelöscht');
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  function handleBlock() {
    if (!blockTarget) return;
    startTransition(async () => {
      const result = await blockUser(blockTarget.id);
      if (result.success) {
        toast.success('Nutzer gesperrt – steht jetzt unter „Freigaben".');
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setBlockTarget(null);
    });
  }

  function handleUpdateRole() {
    if (!editTarget) return;
    startTransition(async () => {
      const result = await updateUserRole(editTarget.id, editRole, editDepartment);
      if (result.success) {
        toast.success('Nutzer aktualisiert');
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setEditTarget(null);
    });
  }

  function handleResetPassword() {
    if (!passwordTarget || !newPassword) return;
    startTransition(async () => {
      const result = await resetUserPassword(passwordTarget.id, newPassword);
      if (result.success) {
        toast.success('Passwort zurückgesetzt');
      } else {
        toast.error(result.error);
      }
      setPasswordTarget(null);
      setNewPassword('');
    });
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Keine Nutzer vorhanden.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {users.map(user => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-lg border p-3 gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={ROLE_COLORS[user.membership.role]}>
                  {ROLE_LABELS[user.membership.role]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {user.membership.department_name}
                </span>
              </div>
            </div>
            {user.id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(user)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Rolle / Abteilung ändern
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPasswordTarget(user); setNewPassword(''); }}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Passwort zurücksetzen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBlockTarget(user)}>
                    <Ban className="mr-2 h-4 w-4" />
                    Sperren
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteTarget(user)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Nutzer löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.email} wird unwiderruflich gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation */}
      <AlertDialog open={!!blockTarget} onOpenChange={() => setBlockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nutzer sperren?</AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget?.email} verliert den Zugriff und landet wieder unter
              „Freigaben". Das Konto bleibt erhalten – du kannst den Nutzer dort
              jederzeit wieder freigeben.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sperren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role/Department */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nutzer bearbeiten</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{editTarget?.email}</p>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={editRole} onValueChange={v => setEditRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_LABELS) as [AppRole, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Abteilung</Label>
              <Select value={editDepartment} onValueChange={setEditDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateRole} disabled={isPending} className="w-full min-h-[48px]">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={!!passwordTarget} onOpenChange={() => setPasswordTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{passwordTarget?.email}</p>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 Zeichen"
              />
            </div>
            <Button
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 6}
              className="w-full min-h-[48px]"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Passwort setzen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
