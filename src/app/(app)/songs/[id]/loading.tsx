import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function SongDetailLoading() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />
      {/* Title */}
      <Skeleton className="h-8 w-64" />
      {/* Artist */}
      <Skeleton className="h-5 w-40" />
      {/* Metadata row */}
      <div className="flex gap-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Separator />
      {/* Transpose controls */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Chord sheet lines */}
      <div className="space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    </main>
  );
}
