'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createUser } from '@/lib/admin/actions';
import type { AppRole, Department } from '@/types/database';

interface CreateUserDialogProps {
  departments: Department[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  leader: 'Leiter',
  member: 'Mitglied',
};

export function CreateUserDialog({ departments }: CreateUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppRole>('member');
  const [departmentId, setDepartmentId] = useState('');

  function resetForm() {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setRole('member');
    setDepartmentId('');
  }

  function handleSubmit() {
    if (!email.trim() || !password || !departmentId) {
      toast.error('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    startTransition(async () => {
      const result = await createUser({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
        departmentId,
      });

      if (result.success) {
        toast.success('Nutzer erstellt');
        resetForm();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-[48px] min-w-[48px]">
          <Plus className="mr-2 h-4 w-4" />
          Nutzer anlegen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Nutzer anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nutzer@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 Zeichen"
            />
          </div>
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
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full min-h-[48px]"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Nutzer erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
