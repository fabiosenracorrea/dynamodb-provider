import { StateSetter, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KeyPiece, RangeQuery } from '@/utils/api';
import { QueryConfig } from './queryConfig.hook';
import { RANGE_OPERATIONS } from './utils';

export interface RangeFilterProps {
  rangeKey?: KeyPiece[];
  customQueries?: RangeQuery[];
  range: QueryConfig['range'];
  setRange: StateSetter<QueryConfig['range']>;
}

export function RangeFilter({
  rangeKey,
  customQueries,
  range,
  setRange,
}: RangeFilterProps) {
  const { mode, operation, params } = range;

  // Get selected range query config from current target's range queries
  const selectedRangeQuery = customQueries?.find((rq) => rq.name === mode);
  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === operation);

  const isCustomMode = mode === 'custom';

  const isPredefinedMode = mode !== 'none' && mode !== 'custom';

  const handleRangeParamChange = (paramName: string, value: string) => {
    setRange((prev) => ({ ...prev, params: { ...prev.params, [paramName]: value } }));
  };

  const handleRangeModeChange = (newMode: string) => {
    const newQuery = customQueries?.find((rq) => rq.name === newMode);

    setRange((old) => ({
      ...old,
      mode: newMode,
      params: newQuery ? Object.fromEntries(newQuery.params.map((p) => [p, ''])) : {},
    }));
  };

  const setOperation = (op: string) => {
    setRange((old) => ({
      ...old,
      operation: op,
    }));
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className={mode === 'none' ? 'flex-1' : ' flex-1 min-w-[160px]'}>
          <h4 className="text-sm font-medium flex items-center gap-2">
            Range Filtering
            {!!rangeKey && (
              <span className="font-mono text-[10px] mt-0.5 text-muted-foreground font-normal">
                {rangeKey
                  .map((p) => (p.type === 'VARIABLE' ? `.${p.value}` : p.value))
                  .join(' | ')}
              </span>
            )}
          </h4>

          <Select value={mode} onValueChange={handleRangeModeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No filter</SelectItem>

              {customQueries?.map((rq) => (
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
                value={params[paramName] || ''}
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
              <Select value={operation} onValueChange={setOperation}>
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
                  value={params[param] || ''}
                  onChange={(e) => handleRangeParamChange(param, e.target.value)}
                  placeholder={param}
                  className="font-mono"
                />
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
