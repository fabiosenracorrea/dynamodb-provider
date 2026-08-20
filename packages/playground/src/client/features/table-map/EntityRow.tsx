import { useNavigate } from 'react-router-dom';
import { CornerDownRight } from 'lucide-react';

import { EntityDot, KeyPattern } from '@/components/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { EntityMetadata, RangeQuery } from '@/utils/api';

function RangeQueryChips({ queries }: { queries: RangeQuery[] }) {
  if (!queries.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {queries.map((query) => (
        <Tooltip key={query.name}>
          <TooltipTrigger asChild>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {query.name}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="font-mono text-xs">{query.operation}</p>
            {!!query.params.length && (
              <p className="mt-0.5 text-[11px] opacity-70">params: {query.params.join(', ')}</p>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function EntityRow({ entity }: { entity: EntityMetadata }) {
  const navigate = useNavigate();

  const open = () => navigate(`/entity/${encodeURIComponent(entity.type)}`);

  return (
    <div className="rounded-md border bg-background transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={open}
        className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <EntityDot type={entity.type} />
          <span className="font-mono text-sm font-medium">{entity.type}</span>
        </span>

        <span className="flex items-baseline gap-2">
          <KeyPattern pieces={entity.partitionKey} />
          <span className="text-muted-foreground">/</span>
          <KeyPattern pieces={entity.rangeKey} />
        </span>
      </button>

      {(entity.indexes.length > 0 || entity.rangeQueries.length > 0) && (
        <div className="space-y-1 border-t px-3 py-2">
          <RangeQueryChips queries={entity.rangeQueries} />

          {entity.indexes.map((index) => (
            <button
              key={index.name}
              type="button"
              onClick={() => navigate(`/entity/${encodeURIComponent(entity.type)}`)}
              className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded px-1 py-0.5 text-left hover:bg-accent/60"
            >
              <CornerDownRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="font-mono text-[11px] text-muted-foreground">{index.index}</span>
              <span className="font-mono text-xs font-medium">{index.name}</span>

              <span className="flex items-baseline gap-1.5">
                <KeyPattern pieces={index.partitionKey} />
                <span className="text-muted-foreground">/</span>
                <KeyPattern pieces={index.rangeKey} />
              </span>

              <RangeQueryChips queries={index.rangeQueries} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
