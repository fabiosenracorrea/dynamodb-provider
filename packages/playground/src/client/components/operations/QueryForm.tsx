import { useState, useMemo } from 'react';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResultsView } from './ResultsView';
import { FiltersSheet, buildFiltersParam, type FilterRow } from './FiltersSheet';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest, KeyPiece, RangeQuery, EntityIndex } from '@/utils/api';

const RANGE_OPERATIONS = [
  { value: 'equal', label: 'Equal', params: ['value'] },
  { value: 'lower_than', label: 'Lower than', params: ['value'] },
  { value: 'lower_or_equal_than', label: 'Lower or equal', params: ['value'] },
  { value: 'bigger_than', label: 'Bigger than', params: ['value'] },
  { value: 'bigger_or_equal_than', label: 'Bigger or equal', params: ['value'] },
  { value: 'begins_with', label: 'Begins with', params: ['value'] },
  { value: 'between', label: 'Between', params: ['start', 'end'] },
] as const;

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
  // rangeMode: 'none' | 'custom' | <rangeQueryName>
  const [rangeMode, setRangeMode] = useState<string>('none');
  const [rangeParams, setRangeParams] = useState<Record<string, string>>({});
  const [customOperation, setCustomOperation] = useState<string>('begins_with');
  const [customRangeParams, setCustomRangeParams] = useState<Record<string, string>>({
    value: '',
    start: '',
    end: '',
  });
  const [limit, setLimit] = useState('25');
  const [retrieveOrder, setRetrieveOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [fullRetrieval, setFullRetrieval] = useState(false);
  const [filters, setFilters] = useState<FilterRow[]>([]);

  const mutation = useExecute();

  // Get selected range query config from current target's range queries
  const selectedRangeQuery = currentConfig.rangeQueries.find(
    (rq) => rq.name === rangeMode,
  );
  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === customOperation);
  const isCustomMode = rangeMode === 'custom';
  const isPredefinedMode = rangeMode !== 'none' && rangeMode !== 'custom';

  const handlePartitionChange = (varName: string, value: string) => {
    setPartitionValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleRangeParamChange = (paramName: string, value: string) => {
    setRangeParams((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleRangeModeChange = (mode: string) => {
    setRangeMode(mode);
    // Reset range params when switching modes
    const newQuery = currentConfig.rangeQueries.find((rq) => rq.name === mode);
    if (newQuery) {
      setRangeParams(Object.fromEntries(newQuery.params.map((p) => [p, ''])));
    } else {
      setRangeParams({});
    }
  };

  const handleTargetChange = (newTarget: string) => {
    setQueryTarget(newTarget);
    // Reset range-related state when target changes
    setRangeMode('none');
    setRangeParams({});
    // Reset partition values - they will be reinitialized
    setPartitionValues({});
  };

  const handleExecute = () => {
    const params: Record<string, unknown> = {};

    // Add partition key values
    partitionVars.forEach((v) => {
      const val = partitionValues[v.name];
      params[v.name] = v.numeric && val ? Number(val) : val;
    });

    // Add fullRetrieval or limit
    if (fullRetrieval) {
      params.fullRetrieval = true;
    } else if (limit) {
      params.limit = Number(limit);
    }

    // Add retrieve order if not default
    if (retrieveOrder !== 'ASC') {
      params.retrieveOrder = retrieveOrder;
    }

    // Add range based on mode
    if (isPredefinedMode && selectedRangeQuery) {
      params.rangeQuery = rangeMode;
      selectedRangeQuery.params.forEach((paramName) => {
        if (rangeParams[paramName]) {
          params[paramName] = rangeParams[paramName];
        }
      });
    } else if (isCustomMode && selectedCustomOp) {
      const range: Record<string, unknown> = { operation: customOperation };
      selectedCustomOp.params.forEach((param) => {
        if (customRangeParams[param]) {
          range[param] = customRangeParams[param];
        }
      });
      params.range = range;
    }

    // Add filters
    const filtersParam = buildFiltersParam(filters);
    if (filtersParam) {
      params.filters = filtersParam;
    }

    mutation.mutate({
      target,
      name,
      operation,
      index: currentConfig.indexName,
      params,
    });
  };

  const isPartitionValid = partitionVars.every(
    (v) => partitionValues[v.name]?.trim() !== '',
  );
  const isPredefinedRangeValid =
    !isPredefinedMode ||
    !selectedRangeQuery ||
    selectedRangeQuery.params.every((p) => rangeParams[p]?.trim() !== '');
  const isCustomRangeValid =
    !isCustomMode ||
    !selectedCustomOp ||
    selectedCustomOp.params.every((p) => customRangeParams[p]?.trim() !== '');
  const isValid = isPartitionValid && isPredefinedRangeValid && isCustomRangeValid;

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-6">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {/* Target Selection */}
      {indexes.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-medium">Query Target</h4>
          <Select value={queryTarget} onValueChange={handleTargetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Table</SelectItem>
              {indexes.map((idx) => (
                <SelectItem key={idx.name} value={idx.name}>
                  <span className="flex items-center gap-2">
                    <span>{idx.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({idx.index})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {/* Partition Key Section */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium">Partition Key</h4>
        {partitionVars.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
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
                  value={partitionValues[variable.name]}
                  onChange={(e) => handlePartitionChange(variable.name, e.target.value)}
                  placeholder={variable.name}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Range Section */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Range Mode Selector - now includes predefined queries directly */}
          <div className={rangeMode === 'none' ? 'flex-1' : ' flex-1 min-w-[160px]'}>
            <h4 className="text-sm font-medium flex items-center gap-2">
              Range Filtering
              <span className="font-mono text-[10px] mt-0.5 text-muted-foreground font-normal">
                {currentConfig.rangeKey
                  .map((p) => (p.type === 'VARIABLE' ? `.${p.value}` : p.value))
                  .join(' | ')}
              </span>
            </h4>
            <Select value={rangeMode} onValueChange={handleRangeModeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No filter</SelectItem>
                {currentConfig.rangeQueries.map((rq) => (
                  <SelectItem key={rq.name} value={rq.name}>
                    <span className="flex items-center gap-2">
                      <span>{rq.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({rq.operation})
                      </span>
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Predefined Range Query params - shown when a predefined query is selected */}
          {isPredefinedMode &&
            selectedRangeQuery?.params.map((paramName) => (
              <div key={paramName} className="flex-1 min-w-[120px]">
                <label className="text-sm font-medium mb-1.5 block">{paramName}</label>
                <Input
                  value={rangeParams[paramName] || ''}
                  onChange={(e) => handleRangeParamChange(paramName, e.target.value)}
                  placeholder={paramName}
                  className="font-mono"
                />
              </div>
            ))}

          {/* Custom Range - Inline */}
          {isCustomMode && (
            <>
              <div className="min-w-[160px]">
                <label className="text-sm font-medium mb-1.5 block">Operation</label>
                <Select value={customOperation} onValueChange={setCustomOperation}>
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
              {selectedCustomOp?.params.map((param) => (
                <div key={param} className="flex-1 min-w-[120px]">
                  <label className="text-sm font-medium mb-1.5 block">{param}</label>
                  <Input
                    value={customRangeParams[param] || ''}
                    onChange={(e) =>
                      setCustomRangeParams((prev) => ({
                        ...prev,
                        [param]: e.target.value,
                      }))
                    }
                    placeholder={param}
                    className="font-mono"
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Filters */}
      <FiltersSheet filters={filters} onChange={setFilters} />

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
              onClick={() => setRetrieveOrder(retrieveOrder === 'ASC' ? 'DESC' : 'ASC')}
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

      <div className="flex items-center gap-4">
        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Query
        </Button>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="fullRetrieval"
            checked={fullRetrieval}
            onChange={(e) => setFullRetrieval(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="fullRetrieval" className="text-sm">
            Full retrieval
          </label>
        </div>
      </div>

      {(result !== null || error) && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <ResultsView data={result} error={error ?? undefined} />
        </div>
      )}
    </div>
  );
}
