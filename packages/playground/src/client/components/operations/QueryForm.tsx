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
import { ResultsView } from './ResultsView';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest, KeyPiece, RangeQuery } from '@/utils/api';

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

  // Extract range key variables
  const rangeVars = useMemo(() => {
    return rangeKey
      .filter((p) => p.type === 'VARIABLE')
      .map((p) => ({ name: p.value, numeric: p.numeric ?? false }));
  }, [rangeKey]);

  // State
  const [partitionValues, setPartitionValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(partitionVars.map((v) => [v.name, '']))
  );
  const [rangeQuery, setRangeQuery] = useState<string>('none');
  const [rangeParams, setRangeParams] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState('25');
  const [retrieveOrder, setRetrieveOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mutation = useExecute();

  // Get selected range query config
  const selectedRangeQuery = rangeQueries.find((rq) => rq.name === rangeQuery);

  const handlePartitionChange = (varName: string, value: string) => {
    setPartitionValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleRangeParamChange = (paramName: string, value: string) => {
    setRangeParams((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleRangeQueryChange = (value: string) => {
    setRangeQuery(value);
    // Reset range params when changing query type
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

    // Add limit
    if (limit) {
      params.limit = Number(limit);
    }

    // Add retrieve order if not default
    if (retrieveOrder !== 'ASC') {
      params.retrieveOrder = retrieveOrder;
    }

    // Add range query if selected
    if (rangeQuery !== 'none' && selectedRangeQuery) {
      params.rangeQuery = rangeQuery;
      // Add range params
      selectedRangeQuery.params.forEach((paramName) => {
        if (rangeParams[paramName]) {
          params[paramName] = rangeParams[paramName];
        }
      });
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
    (v) => partitionValues[v.name]?.trim() !== ''
  );
  const isRangeParamsValid =
    rangeQuery === 'none' ||
    !selectedRangeQuery ||
    selectedRangeQuery.params.every((p) => rangeParams[p]?.trim() !== '');
  const isValid = isPartitionValid && isRangeParamsValid;

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

      {/* Range Query Section */}
      {rangeQueries.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-medium">Range Query</h4>
          <Select value={rangeQuery} onValueChange={handleRangeQueryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select range query..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No range filter</SelectItem>
              {rangeQueries.map((rq) => (
                <SelectItem key={rq.name} value={rq.name}>
                  <span className="flex items-center gap-2">
                    <span>{rq.name}</span>
                    <span className="text-xs text-muted-foreground">({rq.operation})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Range Query Parameters */}
          {selectedRangeQuery && selectedRangeQuery.params.length > 0 && (
            <div className="grid gap-3 pl-4 border-l-2 border-muted">
              {selectedRangeQuery.params.map((paramName) => (
                <div key={paramName}>
                  <label className="text-sm font-medium mb-1.5 block">{paramName}</label>
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
        </section>
      )}

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? '' : '-rotate-90'}`}
          />
          <span>Options</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-4 pt-3 sm:grid-cols-2">
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
