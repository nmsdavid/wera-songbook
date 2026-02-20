import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSetlistWithSongs } from '@/lib/setlists/actions';
import { SetlistEditorForm } from '@/components/setlist/SetlistEditorForm';

interface EditSetlistPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditSetlistPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getSetlistWithSongs(id);
  return {
    title: data ? `${data.setlist.title} bearbeiten – Songbook` : 'Setlist nicht gefunden – Songbook',
  };
}

export default async function EditSetlistPage({ params }: EditSetlistPageProps) {
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
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <Link
        href={`/setlists/${data.setlist.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Setlist
      </Link>
      <h1 className="text-2xl font-bold">{data.setlist.title} bearbeiten</h1>
      <SetlistEditorForm mode="edit" setlist={data.setlist} existingSongs={data.songs} />
    </main>
  );
}
