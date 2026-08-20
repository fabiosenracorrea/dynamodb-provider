import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export function CollectionLoading() {
  return (
    <div className="space-y-4">
      {/* Metadata Card Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="pl-6">
              <Skeleton className="h-10 w-full max-w-sm rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Get Collection Form Skeleton */}
      <Card>
        <CardHeader className="py-3">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div>
              <Skeleton className="h-4 w-20 mb-1.5" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
