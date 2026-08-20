import { SearchX } from 'lucide-react';
import { ItemDetailView } from '@/features/item';

interface GetResultViewProps {
  data: unknown;
  error?: string | null;
  entityType?: string;
}

export function GetResultView({ data, error, entityType }: GetResultViewProps) {
  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">Error</p>
        <p className="mt-1 text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-muted bg-muted/30 p-6 text-muted-foreground">
        <SearchX className="h-8 w-8" />
        <p className="text-sm font-medium">Item not found</p>
      </div>
    );
  }

  return <ItemDetailView item={data as Record<string, unknown>} entityType={entityType} />;
}
