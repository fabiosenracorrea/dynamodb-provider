import { useState, useMemo } from 'react';
import { Loader2, Database, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResultPane } from './ResultPane';
import { buildFiltersParam } from './FiltersSheet';
import { useOperation } from './useOperation';
import { useQueryUrlState } from './useQueryUrlState';
import type { ExecuteRequest, KeyPiece, RangeQuery, EntityIndex } from '@/utils/api';

import {
  buildRangeParams,
  FullRetrievalCheckbox,
  isRangeQueryValid,
  QueryParams,
  useQueryConfig,
} from './QueryParams';
import { omit } from '@/utils/object';

interface QueryFormProps {
  target: ExecuteRequest['target'];
  name: string;
  operation?: string;
  description?: string;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
  rangeQueries: RangeQuery[];
  indexes?: EntityIndex[];
}

export function QueryForm({
  target,
  name,
  operation = 'query',
  description,
  partitionKey,
  rangeKey,
  rangeQueries,
  indexes = [],
}: QueryFormProps) {
  // Target selection state (main or index name)
  const [queryTarget, setQueryTarget] = useState<string>('main');

  // Get current configuration based on selected target
  const currentConfig = useMemo(() => {
    if (queryTarget === 'main') {
      return {
        partitionKey,
        rangeKey,
        rangeQueries,
        indexName: undefined,
      };
    }
    const selectedIndex = indexes.find((idx) => idx.name === queryTarget);
    if (selectedIndex) {
      return {
        partitionKey: selectedIndex.partitionKey,
        rangeKey: selectedIndex.rangeKey,
        rangeQueries: selectedIndex.rangeQueries,
        indexName: selectedIndex.name,
      };
    }
    return {
      partitionKey,
      rangeKey,
      rangeQueries,
      indexName: undefined,
    };
  }, [queryTarget, partitionKey, rangeKey, rangeQueries, indexes]);

  // Extract partition key variables from current config
  const partitionVars = useMemo(() => {
    return currentConfig.partitionKey
      .filter((p) => p.type === 'VARIABLE')
      .map((p) => ({ name: p.value, numeric: p.numeric ?? false }));
  }, [currentConfig.partitionKey]);

  // State
  const [partitionValues, setPartitionValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(partitionVars.map((v) => [v.name, ''])),
  );

  const [queryConfig, configHandlers] = useQueryConfig();

  const operationState = useOperation();

  const syncUrl = useQueryUrlState((shared) => {
    setQueryTarget(shared.target);
    setPartitionValues(shared.partitionValues);
    configHandlers.dispatch(shared.config);
  });

  const handlePartitionChange = (varName: string, value: string) => {
    setPartitionValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleTargetChange = (newTarget: string) => {
    setQueryTarget(newTarget);
    // Reset range-related state when target changes
    configHandlers.dispatch({ range: { ...queryConfig.range, mode: 'custom' } });
    // Reset partition values - they will be reinitialized
    setPartitionValues({});
  };

  const handleExecute = () => {
    // Only on run: mirroring every keystroke would spam history entries.
    syncUrl({ target: queryTarget, partitionValues, config: queryConfig });

    const { rangeQuery, params: rangeParams } = buildRangeParams(
      queryConfig.range,
      currentConfig.rangeQueries,
    );

    const params: Record<string, unknown> = {
      ...omit(queryConfig, ['range', 'limit', 'filters']),
      limit: queryConfig.fullRetrieval ? undefined : Number(queryConfig.limit) || 25,
      filters: buildFiltersParam(queryConfig.filters),
      ...rangeParams,
    };

    partitionVars.forEach((v) => {
      const val = partitionValues[v.name];
      params[v.name] = v.numeric && val ? Number(val) : val;
    });

    operationState.run({
      target,
      name,
      operation,
      rangeQuery,
      index: currentConfig.indexName,
      params,
    });
  };

  const isPartitionValid = partitionVars.every((v) => !!partitionValues[v.name]?.trim());

  const isValid =
    isPartitionValid && isRangeQueryValid(queryConfig.range, currentConfig.rangeQueries);

  return (
    <div className="space-y-6">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {/* Target Selection */}
      {indexes.length > 0 && (
        <section className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Query Target
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleTargetChange('main')}
              className={`
                flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                ${
                  queryTarget === 'main'
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-background hover:bg-accent'
                }
              `}
            >
              <Database className="h-4 w-4" />
              Main Table
            </button>
            {indexes.map((idx) => (
              <button
                key={idx.name}
                type="button"
                onClick={() => handleTargetChange(idx.name)}
                className={`
                  flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${
                    queryTarget === idx.name
                      ? 'bg-primary text-primary-foreground'
                      : 'border bg-background hover:bg-accent'
                  }
                `}
              >
                <Layers className="h-4 w-4" />
                <span>{idx.name}</span>
                <span
                  className={`font-mono text-xs ${
                    queryTarget === idx.name
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {idx.index}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Partition Key Section */}
      <section className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          Partition Key
          <span className="mt-0.5 font-mono text-[10px] font-normal text-muted-foreground">
            {currentConfig.partitionKey
              .map((p) => (p.type === 'VARIABLE' ? `.${p.value}` : p.value))
              .join(' | ')}
          </span>
        </h4>
        {partitionVars.length === 0 ? (
          <p className="pl-1 text-sm italic text-muted-foreground">
            No parameters required - partition key uses only constant values
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            {partitionVars.map((variable) => (
              <div key={variable.name} className="min-w-[140px] flex-1">
                <label className="mb-1.5 flex items-center gap-2 text-sm">
                  <span className="font-medium">{variable.name}</span>
                  {variable.numeric && <span className="text-xs text-muted-foreground">(n)</span>}
                </label>
                <Input
                  type={variable.numeric ? 'number' : 'text'}
                  value={partitionValues[variable.name] ?? ''}
                  onChange={(e) => handlePartitionChange(variable.name, e.target.value)}
                  placeholder={variable.name}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Options */}
      <QueryParams
        params={queryConfig}
        configHandlers={configHandlers}
        rangeKey={currentConfig.rangeKey}
        customQueries={currentConfig.rangeQueries}
      />

      <div className="flex items-center justify-end gap-4">
        <FullRetrievalCheckbox
          selected={queryConfig.fullRetrieval}
          onChange={configHandlers.getSetter('fullRetrieval')}
        />

        <Button onClick={handleExecute} disabled={operationState.isRunning || !isValid}>
          {operationState.isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Query
        </Button>
      </div>

      <ResultPane {...operationState} entityType={target === 'entity' ? name : undefined} />
    </div>
  );
}
