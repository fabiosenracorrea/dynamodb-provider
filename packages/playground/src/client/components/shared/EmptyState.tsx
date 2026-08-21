import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  /** Offer a way back to the map; on by default since this usually means "not found". */
  showHomeLink?: boolean;
}

/**
 * Reached when a route names something the schema doesn't have — a stale link, a
 * renamed entity, a partition that stopped being shared.
 */
export function EmptyState({
  icon: Icon = SearchX,
  title = 'Not found',
  description = "That entity, collection or partition isn't in the current schema. It may have been renamed, or the link may be from an older config.",
  showHomeLink = true,
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>

      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>

      {showHomeLink && (
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link to="/">Back to the table map</Link>
        </Button>
      )}
    </div>
  );
}
