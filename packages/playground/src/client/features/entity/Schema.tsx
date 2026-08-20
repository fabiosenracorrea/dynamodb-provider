import { Key, Search, Layers } from 'lucide-react';

import { KeyPiece, RangeQuery } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { KeyDisplay } from './KeyDisplay';

function RangeQueryBadge({ query, compact = false }: { query: RangeQuery; compact?: boolean }) {
  const hasParams = query.params.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              inline-flex cursor-help items-center gap-1.5 rounded-md border bg-background
              px-2 py-1 transition-colors hover:bg-accent
              ${compact ? 'text-xs' : 'text-sm'}
            `}
          >
            <span className="font-medium">{query.name}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {query.operation}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{query.name}</p>
            <p className="text-xs text-muted-foreground">
              Operation: <span className="font-mono">{query.operation}</span>
            </p>
            {hasParams && (
              <p className="text-xs text-muted-foreground">
                Params: <span className="font-mono">{query.params.join(', ')}</span>
              </p>
            )}
            {!hasParams && <p className="text-xs text-muted-foreground">No parameters required</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface IndexInfo {
  name: string;
  index: string;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
  rangeQueries: RangeQuery[];
}

function IndexesSection({ indexes }: { indexes: IndexInfo[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground">
        <Layers className="h-4 w-4" />
        Secondary Indexes
        <Badge variant="outline" className="ml-1 text-xs">
          {indexes.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 pl-6 sm:grid-cols-2">
        {indexes.map((index) => (
          <div key={index.name} className="space-y-3 rounded-lg border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{index.name}</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {index.index}
              </Badge>
            </div>
            <div className="grid gap-2">
              <KeyDisplay
                label="Partition Key"
                pieces={index.partitionKey}
                compact
                source={index.index}
                isPartitionKey
              />
              <KeyDisplay label="Range Key" pieces={index.rangeKey} compact />
            </div>
            {index.rangeQueries.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Range Queries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {index.rangeQueries.map((rq) => (
                    <RangeQueryBadge key={rq.name} query={rq} compact />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SchemaTabProps {
  entity: {
    partitionKey: KeyPiece[];
    rangeKey: KeyPiece[];
    rangeQueries: RangeQuery[];
    indexes: IndexInfo[];
  };
}

export function EntitySchemaTab({ entity }: SchemaTabProps) {
  return (
    <div className="space-y-6">
      {/* Primary Key Structure */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Key className="h-4 w-4" />
          Primary Key Structure
        </h4>
        <div className="grid gap-2 pl-6">
          <KeyDisplay
            label="Partition Key"
            pieces={entity.partitionKey}
            source="TABLE"
            isPartitionKey
          />
          <KeyDisplay label="Range Key" pieces={entity.rangeKey} />
        </div>
      </div>

      {/* Range Queries */}
      {entity.rangeQueries.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <Search className="h-4 w-4" />
            Range Queries
          </h4>
          <div className="flex flex-wrap gap-2 pl-6">
            {entity.rangeQueries.map((rq) => (
              <RangeQueryBadge key={rq.name} query={rq} />
            ))}
          </div>
        </div>
      )}

      {/* Indexes */}
      {entity.indexes.length > 0 && <IndexesSection indexes={entity.indexes} />}
    </div>
  );
}
