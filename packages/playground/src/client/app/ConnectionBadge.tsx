import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Database, Loader2 } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchConnection } from '@/utils/api';

export function ConnectionBadge() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['connection'],
    queryFn: fetchConnection,
    // A dead database is worth re-checking without a page reload.
    refetchInterval: (query) => (query.state.data?.connected ? false : 10_000),
  });

  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        connecting
      </span>
    );
  }

  if (!data?.connected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-destructive hover:bg-destructive/10"
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            not connected
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <p className="font-medium">{data?.table}</p>
          <p className="mt-1 text-xs opacity-80">{data?.error ?? 'Unknown error'}</p>
          <p className="mt-1 text-xs opacity-60">Click to retry</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
          </span>
          <Database className="h-3.5 w-3.5" />
          <span className="font-mono">{data.table}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>
          Connected · AWS SDK <span className="font-mono">{data.target}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
