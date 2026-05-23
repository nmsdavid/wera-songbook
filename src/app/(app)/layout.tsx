import { redirect } from 'next/navigation';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import { AppShell } from '@/components/layout/app-shell';
import type { UserRoleState } from '@/hooks/use-user-role';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Approval gate: a user without an org membership is registered but not yet
  // approved by an admin. Send them to the waiting screen.
  const membership = await getUserMembership();
  if (!membership) {
    redirect('/pending');
  }

  // Authoritative role for the whole client tree (see useUserRole).
  const userRole: UserRoleState = {
    userId: membership.userId,
    email: membership.email ?? null,
    role: membership.role,
    isAdmin: membership.role === 'admin',
    isLeader: membership.role === 'leader',
    loading: false,
  };

  return <AppShell userRole={userRole}>{children}</AppShell>;
}
