import { SearchX } from 'lucide-react';
import { ItemDetailView } from './ItemDetailView';

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
        <p className="text-sm text-destructive/80 mt-1">{error}</p>
      </div>
    );
  }

  // Handle not found case
  if (data === null || data === undefined) {
    return (
      <div className="rounded-md border border-muted bg-muted/30 p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <SearchX className="h-8 w-8" />
        <p className="text-sm font-medium">Item not found</p>
      </div>
    );
  }

  return (
    <ItemDetailView
      item={data as Record<string, unknown>}
      entityType={entityType}
    />
  );
}
