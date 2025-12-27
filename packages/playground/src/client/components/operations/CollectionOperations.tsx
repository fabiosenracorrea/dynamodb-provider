import { useState, useMemo } from 'react';
import { ChevronDown, Layers, Key, Link2, ArrowRight, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useCollection, useMetadataContext } from '@/context';
import { useExecute } from '@/utils/hooks';
import { GetResultView } from './GetResultView';
import type { KeyPiece } from '@/types';

interface CollectionOperationsProps {
  collectionName: string;
  onSelectEntity?: (entityType: string) => void;
}

export function CollectionOperations({
  collectionName,
  onSelectEntity,
}: CollectionOperationsProps) {
  const collection = useCollection(collectionName);
  const { getEntity, table } = useMetadataContext();
  const [showMetadata, setShowMetadata] = useState(true);

  // Form state
  const [values, setValues] = useState<Record<string, string>>({});
  const mutation = useExecute();

  // Extract partition key variables
  const variables = useMemo(() => {
    if (!collection) return [];
    const vars: Array<{ name: string; numeric: boolean }> = [];
    const seen = new Set<string>();

    collection.partitionKey.forEach((piece) => {
      if (piece.type === 'VARIABLE' && !seen.has(piece.value)) {
        seen.add(piece.value);
        vars.push({
          name: piece.value,
          numeric: piece.numeric ?? false,
        });
      }
    });

    return vars;
  }, [collection]);

  if (!collection) {
    return <CollectionOperationsSkeleton />;
  }

  const originEntity = collection.originEntityType
    ? getEntity(collection.originEntityType)
    : null;

  const handleChange = (varName: string, value: string) => {
    setValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleExecute = () => {
    const params: Record<string, unknown> = {};
    variables.forEach((v) => {
      const val = values[v.name];
      if (v.numeric && val) {
        params[v.name] = Number(val);
      } else {
        params[v.name] = val;
      }
    });

    mutation.mutate({
      target: 'collection',
      name: collection.name,
      operation: 'get',
      params,
    });
  };

  const isValid = variables.every((v) => values[v.name]?.trim() !== '');
  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-4">
      {/* Metadata Card */}
      <Collapsible open={showMetadata} onOpenChange={setShowMetadata}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{collection.name}</CardTitle>
                    <CardDescription className="mt-0.5">
                      {collection.originEntityType && (
                        <span className="font-mono text-xs">
                          from {collection.originEntityType}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={collection.type === 'SINGLE' ? 'default' : 'secondary'}
                    className="font-mono text-xs"
                  >
                    {collection.type}
                  </Badge>
                  {collection.joins.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {collection.joins.length}{' '}
                      {collection.joins.length === 1 ? 'join' : 'joins'}
                    </Badge>
                  )}
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
            <CardContent className="pt-0 space-y-4">
              <Separator />

              {/* Partition Key Structure */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <KeyDisplay pieces={collection.partitionKey} table={table} />
                </h4>
              </div>

              {/* Origin Entity */}
              {originEntity && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Origin Entity
                  </h4>
                  <div className="pl-6">
                    <EntityLink
                      entity={originEntity}
                      onClick={() => onSelectEntity?.(originEntity.type)}
                    />
                  </div>
                </div>
              )}

              {/* Joins */}
              {collection.joins.length > 0 && (
                <JoinsSection
                  joins={collection.joins}
                  getEntity={getEntity}
                  onSelectEntity={onSelectEntity}
                />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Get Collection Form */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Get Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No parameters required - partition key uses only constant values
            </p>
          ) : (
            <div className="grid gap-3">
              {variables.map((variable) => (
                <div key={variable.name}>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                    <span>{variable.name}</span>
                    {variable.numeric && (
                      <span className="text-xs text-muted-foreground font-normal">
                        (numeric)
                      </span>
                    )}
                  </label>
                  <Input
                    type={variable.numeric ? 'number' : 'text'}
                    value={values[variable.name] ?? ''}
                    onChange={(e) => handleChange(variable.name, e.target.value)}
                    placeholder={`Enter ${variable.name}...`}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Collection
          </Button>

          {(result !== null || error) && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Result</h4>
              <GetResultView data={result} error={error ?? undefined} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KeyDisplay({
  pieces,
  table,
}: {
  pieces: KeyPiece[];
  table: { keySeparator?: string } | null;
}) {
  return (
    <div className="flex items-center gap-1 font-mono text-sm bg-muted/50 rounded px-2 py-1 w-fit">
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
                  <span className="text-amber-600 dark:text-amber-400">
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
  );
}

function EntityLink({
  entity,
  onClick,
}: {
  entity: { name: string; type: string };
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-2 rounded-md border hover:bg-accent transition-colors text-left group w-full max-w-sm"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{entity.name}</span>
        <span className="text-xs text-muted-foreground font-mono">{entity.type}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function JoinsSection({
  joins,
  getEntity,
  onSelectEntity,
}: {
  joins: string[];
  getEntity: (type: string) => { name: string; type: string } | undefined;
  onSelectEntity?: (entityType: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Link2 className="h-4 w-4" />
        Joined Entities
        <Badge variant="outline" className="text-xs ml-1">
          {joins.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 space-y-1">
          {joins.map((joinName) => {
            const entity = getEntity(joinName);
            return (
              <button
                key={joinName}
                onClick={() => entity && onSelectEntity?.(entity.type)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{joinName}</span>
                  {entity && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {entity.type}
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollectionOperationsSkeleton() {
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
