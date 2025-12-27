import { useNavigate } from 'react-router-dom';
import { Key, Database, Search, Layers, Users } from 'lucide-react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEntity, useMetadataContext } from '@/context';
import {
  OperationTabs,
  OperationTabsList,
  OperationTabsContent,
  type OperationTab,
} from './OperationTabs';
import { KeyParamsForm } from './KeyParamsForm';
import { BatchGetForm } from './BatchGetForm';
import { ListForm } from './ListForm';
import { QueryForm } from './QueryForm';
import type { KeyPiece, RangeQuery } from '@/utils/api';

interface EntityOperationsProps {
  entityType: string;
}

export function EntityOperations({ entityType }: EntityOperationsProps) {
  const { table } = useMetadataContext();
  const entity = useEntity(entityType);

  if (!entity) {
    return <EntityOperationsSkeleton />;
  }

  const tabs: OperationTab[] = [
    {
      id: 'schema',
      label: 'Schema',
      content: <SchemaTab entity={entity} />,
    },
    {
      id: 'get',
      label: 'Get',
      content: (
        <KeyParamsForm
          target="entity"
          name={entity.type}
          operation="get"
          description="Retrieve a single item by its primary key."
          buttonLabel="Get Item"
          partitionKey={entity.partitionKey}
          rangeKey={entity.rangeKey}
        />
      ),
    },
    {
      id: 'batchGet',
      label: 'Batch Get',
      content: (
        <BatchGetForm
          target="entity"
          name={entity.type}
          description="Retrieve multiple items by their primary keys."
          partitionKey={entity.partitionKey}
          rangeKey={entity.rangeKey}
        />
      ),
    },
    {
      id: 'list',
      label: 'List',
      content: <ListForm target="entity" name={entity.type} />,
      hide: !table?.typeIndex,
    },
    {
      id: 'query',
      label: 'Query',
      content: (
        <QueryForm
          target="entity"
          name={entity.type}
          operation="query"
          description="Query items by partition key with optional range filtering."
          partitionKey={entity.partitionKey}
          rangeKey={entity.rangeKey}
          rangeQueries={entity.rangeQueries}
          indexes={entity.indexes}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <CardHeader className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{entity.name}</CardTitle>
              <CardDescription className="font-mono text-xs mt-0.5">
                type: {entity.type}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entity.indexes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {entity.indexes.length}{' '}
                {entity.indexes.length === 1 ? 'index' : 'indexes'}
              </Badge>
            )}
            <Badge variant="secondary" className="font-mono">
              Entity
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Tabs */}
      <OperationTabs tabs={tabs} defaultTab="schema">
        <CardHeader className="p-2 pt-0">
          <OperationTabsList tabs={tabs} />
        </CardHeader>
        <CardContent className="p-2">
          <OperationTabsContent tabs={tabs} />
        </CardContent>
      </OperationTabs>
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

function SchemaTab({ entity }: SchemaTabProps) {
  return (
    <div className="space-y-6">
      {/* Primary Key Structure */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
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
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Range Queries
          </h4>
          <div className="pl-6 flex flex-wrap gap-2">
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

function buildPattern(pieces: KeyPiece[]): string {
  return pieces
    .map((piece) => (piece.type === 'CONSTANT' ? piece.value : '{value}'))
    .join('#');
}

interface KeyDisplayProps {
  label: string;
  pieces: KeyPiece[];
  compact?: boolean;
  source?: string; // 'TABLE' or index name - only for partition keys
  isPartitionKey?: boolean;
}

function KeyDisplay({
  label,
  pieces,
  compact = false,
  source,
  isPartitionKey = false,
}: KeyDisplayProps) {
  const navigate = useNavigate();
  const { table, getPartitionGroup } = useMetadataContext();

  // Look up partition group if this is a partition key
  const partitionGroup =
    isPartitionKey && source
      ? getPartitionGroup(`${source}|${buildPattern(pieces)}`)
      : undefined;

  const handlePartitionClick = () => {
    if (partitionGroup) {
      navigate(`/partition/${encodeURIComponent(partitionGroup.id)}`);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="text-muted-foreground min-w-[90px]">{label}:</span>
      <div className="flex items-center gap-1 font-mono bg-muted/50 rounded px-2 py-1">
        {pieces.map((piece, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5">
                  {idx > 0 && (
                    <span className="text-muted-foreground mx-0.5">
                      {table?.keySeparator ?? '#'}
                    </span>
                  )}
                  {piece.type === 'CONSTANT' ? (
                    <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                      {piece.value}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                      {piece.value}
                      {piece.numeric && (
                        <span className="text-[10px] text-muted-foreground">(n)</span>
                      )}
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {piece.type === 'CONSTANT' ? 'Constant value' : 'Dynamic variable'}
                  {piece.numeric && ' (numeric)'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      {partitionGroup && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handlePartitionClick}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                <span className={compact ? 'text-[10px]' : 'text-xs'}>
                  {partitionGroup.entities.length}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium mb-1">
                {partitionGroup.entities.length} entities share this partition
              </p>
              <p className="text-xs text-muted-foreground">
                {partitionGroup.entities.join(', ')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
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
      <div className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors">
        <Layers className="h-4 w-4" />
        Secondary Indexes
        <Badge variant="outline" className="text-xs ml-1">
          {indexes.length}
        </Badge>
      </div>

      <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {indexes.map((index) => (
          <div key={index.name} className="border rounded-lg px-3 py-3 space-y-3">
            <div className="flex items-center gap-2 justify-between">
              <span className="font-medium">{index.name}</span>
              <Badge variant="secondary" className="text-xs font-mono">
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

function RangeQueryBadge({
  query,
  compact = false,
}: {
  query: RangeQuery;
  compact?: boolean;
}) {
  const hasParams = query.params.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              inline-flex items-center gap-1.5 rounded-md border px-2 py-1
              bg-background hover:bg-accent transition-colors cursor-help
              ${compact ? 'text-xs' : 'text-sm'}
            `}
          >
            <span className="font-medium">{query.name}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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
            {!hasParams && (
              <p className="text-xs text-muted-foreground">No parameters required</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function EntityOperationsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <CardHeader className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </CardHeader>

      {/* Tabs skeleton */}
      <CardHeader className="p-2 pt-0">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-md" />
          ))}
        </div>
      </CardHeader>

      {/* Content skeleton */}
      <CardContent className="p-2">
        <div className="space-y-6">
          {/* Primary Key Structure */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="grid gap-2 pl-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-48 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-40 rounded" />
              </div>
            </div>
          </div>

          {/* Indexes skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg px-3 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
