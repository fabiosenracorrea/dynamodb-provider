import { useState, useMemo } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ResultsView } from './ResultsView';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest, KeyPiece, RangeQuery } from '@/utils/api';

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
  index?: string;
  description?: string;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
  rangeQueries: RangeQuery[];
}

export function QueryForm({
  target,
  name,
  operation = 'query',
  index,
  description,
  partitionKey,
  rangeKey,
  rangeQueries,
}: QueryFormProps) {
  // Extract partition key variables
  const partitionVars = useMemo(() => {
    return partitionKey
      .filter((p) => p.type === 'VARIABLE')
      .map((p) => ({ name: p.value, numeric: p.numeric ?? false }));
  }, [partitionKey]);

  // State
  const [partitionValues, setPartitionValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(partitionVars.map((v) => [v.name, ''])),
  );
  const [rangeMode, setRangeMode] = useState<'none' | 'predefined' | 'custom'>('none');
  const [rangeQuery, setRangeQuery] = useState<string>('');
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mutation = useExecute();

  // Get selected range query config
  const selectedRangeQuery = rangeQueries.find((rq) => rq.name === rangeQuery);
  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === customOperation);

  const handlePartitionChange = (varName: string, value: string) => {
    setPartitionValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleRangeParamChange = (paramName: string, value: string) => {
    setRangeParams((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleRangeModeChange = (mode: 'none' | 'predefined' | 'custom') => {
    setRangeMode(mode);
    if (mode === 'predefined' && rangeQueries.length > 0 && !rangeQuery) {
      setRangeQuery(rangeQueries[0].name);
      setRangeParams(Object.fromEntries(rangeQueries[0].params.map((p) => [p, ''])));
    }
  };

  const handleRangeQueryChange = (value: string) => {
    setRangeQuery(value);
    const newQuery = rangeQueries.find((rq) => rq.name === value);
    if (newQuery) {
      setRangeParams(Object.fromEntries(newQuery.params.map((p) => [p, ''])));
    } else {
      setRangeParams({});
    }
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
    if (rangeMode === 'predefined' && selectedRangeQuery) {
      params.rangeQuery = rangeQuery;
      selectedRangeQuery.params.forEach((paramName) => {
        if (rangeParams[paramName]) {
          params[paramName] = rangeParams[paramName];
        }
      });
    } else if (rangeMode === 'custom' && selectedCustomOp) {
      const range: Record<string, unknown> = { operation: customOperation };
      selectedCustomOp.params.forEach((param) => {
        if (customRangeParams[param]) {
          range[param] = customRangeParams[param];
        }
      });
      params.range = range;
    }

    mutation.mutate({
      target,
      name,
      operation,
      index,
      params,
    });
  };

  const isPartitionValid = partitionVars.every(
    (v) => partitionValues[v.name]?.trim() !== '',
  );
  const isPredefinedRangeValid =
    rangeMode !== 'predefined' ||
    !selectedRangeQuery ||
    selectedRangeQuery.params.every((p) => rangeParams[p]?.trim() !== '');
  const isCustomRangeValid =
    rangeMode !== 'custom' ||
    !selectedCustomOp ||
    selectedCustomOp.params.every((p) => customRangeParams[p]?.trim() !== '');
  const isValid = isPartitionValid && isPredefinedRangeValid && isCustomRangeValid;

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-6">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {/* Partition Key Section */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium">Partition Key</h4>
        {partitionVars.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No parameters required - partition key uses only constant values
          </p>
        ) : (
          <div className="grid gap-3">
            {partitionVars.map((variable) => (
              <div key={variable.name}>
                <label className="text-sm mb-1.5 flex items-center gap-2">
                  <span className="font-medium">{variable.name}</span>
                  {variable.numeric && (
                    <span className="text-xs text-muted-foreground">(numeric)</span>
                  )}
                </label>
                <Input
                  type={variable.numeric ? 'number' : 'text'}
                  value={partitionValues[variable.name]}
                  onChange={(e) => handlePartitionChange(variable.name, e.target.value)}
                  placeholder={`Enter ${variable.name}...`}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Range Section */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium">Range Filtering</h4>
        <Select
          value={rangeMode}
          onValueChange={(v) => handleRangeModeChange(v as typeof rangeMode)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select range filter type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No range filter</SelectItem>
            {rangeQueries.length > 0 && (
              <SelectItem value="predefined">Predefined query</SelectItem>
            )}
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        {/* Predefined Range Query */}
        {rangeMode === 'predefined' && rangeQueries.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <Select value={rangeQuery} onValueChange={handleRangeQueryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select query..." />
              </SelectTrigger>
              <SelectContent>
                {rangeQueries.map((rq) => (
                  <SelectItem key={rq.name} value={rq.name}>
                    <span className="flex items-center gap-2">
                      <span>{rq.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({rq.operation})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRangeQuery && selectedRangeQuery.params.length > 0 && (
              <div className="grid gap-3">
                {selectedRangeQuery.params.map((paramName) => (
                  <div key={paramName}>
                    <label className="text-sm font-medium mb-1.5 block">
                      {paramName}
                    </label>
                    <Input
                      value={rangeParams[paramName] || ''}
                      onChange={(e) => handleRangeParamChange(paramName, e.target.value)}
                      placeholder={`Enter ${paramName}...`}
                      className="font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Range */}
        {rangeMode === 'custom' && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div>
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

            {selectedCustomOp && (
              <div className="grid gap-3">
                {selectedCustomOp.params.map((param) => (
                  <div key={param}>
                    <label className="text-sm font-medium mb-1.5 block">{param}</label>
                    <Input
                      value={customRangeParams[param] || ''}
                      onChange={(e) =>
                        setCustomRangeParams((prev) => ({
                          ...prev,
                          [param]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${param}...`}
                      className="font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? '' : '-rotate-90'}`}
          />
          <span>Options</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 pt-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="fullRetrieval"
                checked={fullRetrieval}
                onChange={(e) => setFullRetrieval(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="fullRetrieval" className="text-sm">
                Full retrieval{' '}
                <span className="text-muted-foreground">(auto-paginate all results)</span>
              </label>
            </div>

            {!fullRetrieval && (
              <>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
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
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Order</label>
                    <Select
                      value={retrieveOrder}
                      onValueChange={(v) => setRetrieveOrder(v as 'ASC' | 'DESC')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">Ascending</SelectItem>
                        <SelectItem value="DESC">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Execute Query
      </Button>

      {(result !== null || error) && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <ResultsView data={result} error={error ?? undefined} />
        </div>
      )}
    </div>
  );
}
