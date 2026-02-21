import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import { getUsers, getDepartments } from '@/lib/admin/actions';
import { AdminPanel } from '@/components/admin/admin-panel';

export const metadata: Metadata = { title: 'Verwaltung – Songbook' };

export default async function AdminPage() {
  const supabase = await createServerClient();
  const membership = await getUserMembership(supabase);

  if (!membership || membership.role !== 'admin') {
    redirect('/songs');
  }

  const [usersResult, deptsResult] = await Promise.all([
    getUsers(),
    getDepartments(),
  ]);

  const users = usersResult.success ? usersResult.data.users : [];
  const departments = deptsResult.success ? deptsResult.data.departments : [];

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <AdminPanel
        users={users}
        departments={departments}
        currentUserId={membership.userId}
      />
    </main>
  );
}
