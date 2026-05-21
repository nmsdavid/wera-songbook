import { redirect } from 'next/navigation';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import { AppShell } from '@/components/layout/app-shell';

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

  return <AppShell>{children}</AppShell>;
}
