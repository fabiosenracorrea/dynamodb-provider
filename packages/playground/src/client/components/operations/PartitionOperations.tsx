import { useState, useMemo } from 'react';
import {
  ChevronDown,
  Layers,
  ArrowRight,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { usePartitionGroup, useMetadataContext } from '@/context';
import { useExecute } from '@/utils/hooks';
import { ListResultView } from './ListResultView';
import type { KeyPiece, PartitionGroup, EntityMetadata } from '@/types';

interface PartitionOperationsProps {
  partitionId: string;
  onSelectEntity?: (entityType: string) => void;
}

function formatKeyPieces(pieces: KeyPiece[]): string {
  return pieces.map((p) => (p.type === 'CONSTANT' ? p.value : `{${p.value}}`)).join('#');
}

function getRangeKeyForEntity(
  entity: EntityMetadata | undefined,
  partition: PartitionGroup,
): string | null {
  if (!entity) return null;

  if (partition.sourceType === 'main') {
    return formatKeyPieces(entity.rangeKey);
  }

  const idx = entity.indexes.find((i) => i.index === partition.source);
  return idx ? formatKeyPieces(idx.rangeKey) : null;
}

const RANGE_OPERATIONS = [
  { value: 'none', label: 'No filter', params: [] },
  { value: 'begins_with', label: 'Begins with', params: ['value'] },
  { value: 'equal', label: 'Equal', params: ['value'] },
  { value: 'lower_than', label: 'Lower than', params: ['value'] },
  { value: 'lower_or_equal_than', label: 'Lower or equal', params: ['value'] },
  { value: 'bigger_than', label: 'Bigger than', params: ['value'] },
  { value: 'bigger_or_equal_than', label: 'Bigger or equal', params: ['value'] },
  { value: 'between', label: 'Between', params: ['start', 'end'] },
] as const;

export function PartitionOperations({
  partitionId,
  onSelectEntity,
}: PartitionOperationsProps) {
  const partition = usePartitionGroup(partitionId);
  const { getEntity } = useMetadataContext();
  const [showEntities, setShowEntities] = useState(true);

  // Query state
  const [partitionValues, setPartitionValues] = useState<Record<string, string>>({});
  const [rangeOperation, setRangeOperation] = useState('none');
  const [rangeParams, setRangeParams] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState('25');
  const [retrieveOrder, setRetrieveOrder] = useState<'ASC' | 'DESC'>('ASC');

  const mutation = useExecute();

  // Get partition key structure from first entity
  const partitionKeyPieces = useMemo<KeyPiece[]>(() => {
    if (!partition || partition.entities.length === 0) return [];

    const firstEntityType = partition.entities[0];
    const entity = getEntity(firstEntityType);
    if (!entity) return [];

    if (partition.sourceType === 'main') {
      return entity.partitionKey;
    }
    const idx = entity.indexes.find((i) => i.index === partition.source);
    return idx?.partitionKey ?? [];
  }, [partition, getEntity]);

  // Extract variables from partition key
  const partitionVars = useMemo(() => {
    return partitionKeyPieces
      .filter((p) => p.type === 'VARIABLE')
      .map((p, i) => ({
        name: p.value,
        placeholder: `value${i === 0 ? '' : i + 1}`,
        numeric: p.numeric ?? false,
      }));
  }, [partitionKeyPieces]);

  if (!partition) {
    return null;
  }

  const selectedOp = RANGE_OPERATIONS.find((op) => op.value === rangeOperation);

  const handleExecute = () => {
    // Build partition key array
    const partitionKeyValues = partitionKeyPieces.map((piece) => {
      if (piece.type === 'CONSTANT') {
        return piece.value;
      }
      const varDef = partitionVars.find((v) => v.name === piece.value);
      const val = partitionValues[piece.value] ?? '';
      return varDef?.numeric && val ? Number(val) : val;
    });

    const params: Record<string, unknown> = {
      partition: partitionKeyValues,
      limit: Number(limit),
    };

    if (retrieveOrder !== 'ASC') {
      params.retrieveOrder = retrieveOrder;
    }

    // Add range operation if selected
    if (rangeOperation !== 'none' && selectedOp) {
      const range: Record<string, unknown> = { operation: rangeOperation };
      selectedOp.params.forEach((param) => {
        if (rangeParams[param]) {
          range[param] = rangeParams[param];
        }
      });
      params.range = range;
    }

    mutation.mutate({
      target: 'table',
      name: partition.sourceType === 'main' ? 'main' : partition.source,
      operation: 'query',
      params,
    });
  };

  const isPartitionValid = partitionVars.every(
    (v) => partitionValues[v.name]?.trim() !== '',
  );
  const isRangeValid =
    rangeOperation === 'none' ||
    !selectedOp ||
    selectedOp.params.every((p) => rangeParams[p]?.trim() !== '');
  const isValid = isPartitionValid && isRangeValid;

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-mono">{partition.pattern}</CardTitle>
                <CardDescription className="mt-0.5">
                  Shared partition across {partition.entities.length} entities
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {partition.source}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Collapsible open={showEntities} onOpenChange={setShowEntities}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showEntities ? '' : '-rotate-90'
                }`}
              />
              <span className="font-medium">Entities in this partition</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {partition.entities.length}
              </Badge>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="pt-2">
                <Separator className="mb-3" />
                <div className="space-y-1">
                  {partition.entities.map((entityType) => {
                    const entity = getEntity(entityType);
                    const rangeKey = getRangeKeyForEntity(entity, partition);
                    return (
                      <button
                        key={entityType}
                        onClick={() => onSelectEntity?.(entityType)}
                        className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left group"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {entity?.name ?? entityType}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {entityType}
                            </span>
                          </div>
                          {rangeKey && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {rangeKey}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Query Card */}
      <Card>
        <div className="p-6 flex items-center gap-3">
          <CardTitle className="text-base">Query Partition</CardTitle>
          <span className="font-mono text-[10px] mt-0.5 text-muted-foreground font-normal">
            {partitionKeyPieces
              .map((p) => (p.type === 'VARIABLE' ? `.${p.value}` : p.value))
              .join(' | ')}
          </span>
        </div>
        <CardContent className="space-y-6">
          {/* Partition Key */}
          <section className="space-y-3">
            {partitionVars.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-1">
                No parameters required - partition key uses only constant values
              </p>
            ) : (
              <div className="flex flex-wrap gap-3 items-end">
                {partitionVars.map((variable) => (
                  <div key={variable.name} className="flex-1 min-w-[140px]">
                    <label className="text-sm mb-1.5 flex items-center gap-2">
                      <span className="font-medium">{variable.name}</span>
                      {variable.numeric && (
                        <span className="text-xs text-muted-foreground">(n)</span>
                      )}
                    </label>
                    <Input
                      type={variable.numeric ? 'number' : 'text'}
                      value={partitionValues[variable.name] ?? ''}
                      onChange={(e) =>
                        setPartitionValues((prev) => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                      placeholder={variable.name}
                      className="font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Range */}
          <section className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div
                className={rangeOperation === 'none' ? 'flex-1' : 'flex-1 min-w-[160px]'}
              >
                <h4 className="text-sm font-medium">Range Filtering</h4>
                <Select value={rangeOperation} onValueChange={setRangeOperation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGE_OPERATIONS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOp &&
                selectedOp.params.map((param) => (
                  <div key={param} className="flex-1 min-w-[120px]">
                    <label className="text-sm font-medium mb-1.5 block">{param}</label>
                    <Input
                      value={rangeParams[param] ?? ''}
                      onChange={(e) =>
                        setRangeParams((prev) => ({
                          ...prev,
                          [param]: e.target.value,
                        }))
                      }
                      placeholder={param}
                      className="font-mono"
                    />
                  </div>
                ))}
            </div>
          </section>

          {/* Options */}
          <section className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-[100px] flex-1">
                <label className="text-sm font-medium mb-1.5 block">Limit</label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="25"
                  min={1}
                  max={1000}
                />
              </div>
              <div className="min-w-[140px] flex-1">
                <label className="text-sm font-medium mb-1.5 block">Order</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() =>
                    setRetrieveOrder(retrieveOrder === 'ASC' ? 'DESC' : 'ASC')
                  }
                >
                  <span>{retrieveOrder === 'ASC' ? 'Ascending' : 'Descending'}</span>
                  {retrieveOrder === 'ASC' ? (
                    <ArrowUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ArrowDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          </section>

          <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Query
          </Button>

          {(result !== null || error) && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Result</h4>
              <ListResultView data={result} error={error ?? undefined} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
