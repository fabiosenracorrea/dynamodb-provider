import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function PartitionLoading() {
  return (
    <div className="space-y-4">
      {/* Header Card Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </div>
            <Separator />
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query Card Skeleton */}
      <Card>
        <div className="flex items-center gap-3 p-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
        <CardContent className="space-y-6">
          {/* Partition Key */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px] flex-1">
                <Skeleton className="mb-1.5 h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </section>

          {/* Range */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px] flex-1">
                <Skeleton className="mb-1.5 h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </section>

          {/* Options */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[100px] flex-1">
                <Skeleton className="mb-1.5 h-4 w-12" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="min-w-[140px] flex-1">
                <Skeleton className="mb-1.5 h-4 w-12" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </section>

          <Skeleton className="h-10 w-20 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
