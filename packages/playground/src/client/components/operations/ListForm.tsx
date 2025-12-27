import { useState } from 'react';
import { Loader2, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListResultView } from './ListResultView';
import { FiltersSheet, buildFiltersParam, type FilterRow } from './FiltersSheet';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest } from '@/utils/api';

const RANGE_OPERATIONS = [
  { value: 'equal', label: 'Equal', params: ['value'] },
  { value: 'lower_than', label: 'Lower than', params: ['value'] },
  { value: 'lower_or_equal_than', label: 'Lower or equal', params: ['value'] },
  { value: 'bigger_than', label: 'Bigger than', params: ['value'] },
  { value: 'bigger_or_equal_than', label: 'Bigger or equal', params: ['value'] },
  { value: 'begins_with', label: 'Begins with', params: ['value'] },
  { value: 'between', label: 'Between', params: ['start', 'end'] },
] as const;

interface ListFormProps {
  target: ExecuteRequest['target'];
  name: string;
}

export function ListForm({ target, name }: ListFormProps) {
  const [rangeMode, setRangeMode] = useState<string>('none');
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

  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === customOperation);
  const isCustomMode = rangeMode === 'custom';

  const handleRangeModeChange = (mode: string) => {
    setRangeMode(mode);
  };

  const handleExecute = () => {
    const params: Record<string, unknown> = {};

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

    // Add range if custom mode
    if (isCustomMode && selectedCustomOp) {
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
      operation: 'list',
      params,
    });
  };

  const isCustomRangeValid =
    !isCustomMode ||
    !selectedCustomOp ||
    selectedCustomOp.params.every((p) => customRangeParams[p]?.trim() !== '');
  const isValid = isCustomRangeValid;

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          This operation requires a{' '}
          <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">
            typeIndex
          </code>{' '}
          GSI configured on the table, and entities must have their type columns properly
          set.
        </p>
      </div>

      {/* Range Section */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Range Mode Selector */}
          <div className={rangeMode === 'none' ? 'flex-1' : 'flex-1 min-w-[160px]'}>
            <h4 className="text-sm font-medium mb-1.5">Range Filtering</h4>
            <Select value={rangeMode} onValueChange={handleRangeModeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No filter</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

      {/* Options */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Filters */}
          <FiltersSheet filters={filters} onChange={setFilters} />

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

      <div className="flex items-center gap-4 justify-end">
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

        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          List
        </Button>
      </div>

      {(result !== null || error) && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <ListResultView
            data={result}
            error={error ?? undefined}
            entityType={target === 'entity' ? name : undefined}
          />
        </div>
      )}
    </div>
  );
}
