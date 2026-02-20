import { Skeleton } from '@/components/ui/skeleton';

export default function SetlistDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 w-12" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}
