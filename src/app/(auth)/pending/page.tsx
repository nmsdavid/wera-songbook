import { redirect } from 'next/navigation';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import { PendingNotice } from '@/components/auth/PendingNotice';

export const metadata = {
  title: 'Warte auf Freigabe – Songbook',
};

export default async function PendingPage() {
  // Already approved? Send them into the app.
  const membership = await getUserMembership();
  if (membership) {
    redirect('/songs');
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <PendingNotice />
    </main>
  );
}
