import { useState, useMemo } from 'react';
import { Layers, Loader2 } from 'lucide-react';
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

import { usePartitionGroup, useMetadataContext } from '@/context';
import { useExecute } from '@/utils/hooks';
import { omit } from '@/utils/object';

import type { KeyPiece } from '../../../../types';

import { ListResultView } from '../ListResultView';
import { PartitionLoading } from './Loading';
import {
  buildRangeParams,
  FullRetrievalCheckbox,
  isRangeQueryValid,
  QueryParams,
  useQueryConfig,
} from '../QueryParams';
import { PartitionEntityList } from './EntityList';

interface PartitionOperationsProps {
  partitionId: string;
  onSelectEntity?: (entityType: string) => void;
}

export function PartitionView({ partitionId }: PartitionOperationsProps) {
  const [queryConfig, configHandlers] = useQueryConfig();

  const partition = usePartitionGroup(partitionId);
  const { getEntity } = useMetadataContext();

  // Query state
  const [partitionValues, setPartitionValues] = useState<Record<string, string>>({});

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
    return <PartitionLoading />;
  }

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
      ...omit(queryConfig, ['range', 'filters']),
      limit: queryConfig.fullRetrieval ? undefined : Number(queryConfig.limit) || 25,
      partition: partitionKeyValues,
      ...buildRangeParams(queryConfig.range),
    };

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

  const isRangeValid = isRangeQueryValid(queryConfig.range);

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

        <PartitionEntityList partition={partition} />
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

          <QueryParams
            params={queryConfig}
            configHandlers={configHandlers}
            filter={false}
          />

          <div className="flex items-center gap-4 justify-end">
            <FullRetrievalCheckbox
              selected={queryConfig.fullRetrieval}
              onChange={configHandlers.getSetter('fullRetrieval')}
            />

            <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Query
            </Button>
          </div>

          {!!mutation.data && (
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
