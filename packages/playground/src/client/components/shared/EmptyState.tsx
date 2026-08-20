import { MousePointerClick } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <MousePointerClick className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">No Selection</h2>
      <p className="max-w-sm text-muted-foreground">
        Select an entity, collection, or partition from the sidebar to view and execute operations.
      </p>
    </div>
  );
}
