'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { approveUser, rejectUser } from '@/lib/admin/actions';
import type { PendingUser } from '@/lib/admin/actions';
import type { AppRole, Department } from '@/types/database';

interface PendingListProps {
  users: PendingUser[];
  departments: Department[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  leader: 'Leiter',
  member: 'Mitglied',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PendingList({ users, departments }: PendingListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [role, setRole] = useState<AppRole>('member');
  const [departmentId, setDepartmentId] = useState('');

  function openApprove(user: PendingUser) {
    setApproveTarget(user);
    setRole('member');
    setDepartmentId(departments[0]?.id ?? '');
  }

  function handleApprove() {
    if (!approveTarget) return;
    if (!departmentId) {
      toast.error('Bitte eine Abteilung wählen.');
      return;
    }
    startTransition(async () => {
      const result = await approveUser(approveTarget.id, role, departmentId);
      if (result.success) {
        toast.success('Nutzer freigegeben');
        setApproveTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    startTransition(async () => {
      const result = await rejectUser(rejectTarget.id);
      if (result.success) {
        toast.success('Anfrage abgelehnt');
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setRejectTarget(null);
    });
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Keine offenen Anfragen.
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
              <p className="font-medium truncate">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.displayName ? `${user.email} · ` : ''}
                Registriert am {formatDate(user.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="icon"
                className="min-h-[48px] min-w-[48px]"
                onClick={() => openApprove(user)}
                aria-label="Freigeben"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[48px] min-w-[48px] text-destructive"
                onClick={() => setRejectTarget(user)}
                aria-label="Ablehnen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Approve: pick role + department */}
      <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nutzer freigeben</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {approveTarget?.displayName
              ? `${approveTarget.displayName} (${approveTarget.email})`
              : approveTarget?.email}
          </p>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Abteilung *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Abteilung wählen" />
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
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={role} onValueChange={v => setRole(v as AppRole)}>
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
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full min-h-[48px]"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Freigeben
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject confirmation */}
      <AlertDialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anfrage ablehnen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Konto von {rejectTarget?.email} wird unwiderruflich gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ablehnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
