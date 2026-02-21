import { Skeleton } from '@/components/ui/skeleton';

export default function SongsLoading() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Songs</h1>
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full" />
      {/* Category filter skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      {/* Song cards skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
