import { getSetlistsForList } from '@/lib/setlists/actions';
import { SetlistListClient } from '@/components/setlist/SetlistListClient';

export const metadata = {
  title: 'Setlists – Songbook',
};

export default async function SetlistsPage() {
  const setlists = await getSetlistsForList();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <SetlistListClient setlists={setlists} />
    </main>
  );
}
