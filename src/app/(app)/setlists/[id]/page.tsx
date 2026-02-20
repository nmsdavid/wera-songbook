import type { Metadata } from 'next';
import { getSetlistWithSongs } from '@/lib/setlists/actions';
import { SetlistDetailView } from '@/components/setlist/SetlistDetailView';

interface SetlistDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SetlistDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getSetlistWithSongs(id);
  return {
    title: data ? `${data.setlist.title} – Songbook` : 'Setlist nicht gefunden – Songbook',
  };
}

export default async function SetlistDetailPage({ params }: SetlistDetailPageProps) {
  const { id } = await params;
  const data = await getSetlistWithSongs(id);

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <div className="py-12 text-center">
          <p className="text-lg font-medium">Setlist nicht gefunden.</p>
          <a
            href="/setlists"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Zurück zur Setlist-Liste
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <SetlistDetailView setlist={data.setlist} songs={data.songs} />
    </main>
  );
}
