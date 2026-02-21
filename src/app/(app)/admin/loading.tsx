import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-12 w-full" />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
