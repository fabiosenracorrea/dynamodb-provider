import { useState } from 'react';
import { ChevronDown, Key, Database, Search, Layers } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
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
import { ListForm } from './ListForm';
import { QueryForm } from './QueryForm';
import type { KeyPiece, RangeQuery } from '@/utils/api';

interface EntityOperationsProps {
  entityType: string;
}

export function EntityOperations({ entityType }: EntityOperationsProps) {
  const { table } = useMetadataContext();
  const entity = useEntity(entityType);
  const [showMetadata, setShowMetadata] = useState(true);

  if (!entity) {
    return null;
  }

  const tabs: OperationTab[] = [
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
      <Collapsible open={showMetadata} onOpenChange={setShowMetadata}>
        <CollapsibleTrigger asChild>
          <CardHeader className="p-2 cursor-pointer hover:bg-muted/50 transition-colors">
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
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    showMetadata ? '' : '-rotate-90'
                  }`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-2 space-y-4">
            <Separator />

            {/* Primary Key Structure */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Primary Key Structure
              </h4>
              <div className="grid gap-2 pl-6">
                <KeyDisplay label="Partition Key" pieces={entity.partitionKey} />
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <OperationTabs tabs={tabs} defaultTab="query">
        <CardHeader className="p-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Operations</CardTitle>
            <OperationTabsList tabs={tabs} />
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <OperationTabsContent tabs={tabs} />
        </CardContent>
      </OperationTabs>
    </div>
  );
}

function KeyDisplay({
  label,
  pieces,
  compact = false,
}: {
  label: string;
  pieces: KeyPiece[];
  compact?: boolean;
}) {
  const { table } = useMetadataContext();

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
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Layers className="h-4 w-4" />
        Secondary Indexes
        <Badge variant="outline" className="text-xs ml-1">
          {indexes.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {indexes.map((index) => (
            <div key={index.name} className="border rounded-lg px-3 py-3 space-y-3">
              <div className="flex items-center gap-2 justify-between">
                <span className="font-medium">{index.name}</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {index.index}
                </Badge>
              </div>
              <div className="grid gap-2">
                <KeyDisplay label="Partition Key" pieces={index.partitionKey} compact />
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
      </CollapsibleContent>
    </Collapsible>
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
