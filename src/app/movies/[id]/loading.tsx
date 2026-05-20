import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex gap-8">
      <Skeleton className="w-64 aspect-2/3 rounded-lg shrink-0" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
