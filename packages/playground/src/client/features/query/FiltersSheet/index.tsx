import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import type { FilterRow } from './types';
import { createEmptyFilter } from './types';
import { FILTER_OPERATIONS, getOpConfig, type FilterOperation } from './constants';

export type { FilterRow };
export * from './buildFiltersParam';

interface FiltersSheetProps {
  filters: FilterRow[];
  onChange: (filters: FilterRow[]) => void;
}

export function FiltersSheet({ filters, onChange }: FiltersSheetProps) {
  const [open, setOpen] = useState(false);

  const addFilter = () => {
    onChange([...filters, createEmptyFilter()]);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterRow>) => {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getOperationSymbol = (op: FilterOperation): string => {
    const symbols: Record<FilterOperation, string> = {
      equal: '=',
      not_equal: '≠',
      lower_than: '<',
      lower_or_equal_than: '≤',
      bigger_than: '>',
      bigger_or_equal_than: '≥',
      begins_with: '^=',
      contains: '∋',
      not_contains: '∌',
      between: '↔',
      in: '∈',
      not_in: '∉',
      exists: '∃',
      not_exists: '∄',
    };
    return symbols[op];
  };

  const isValidFilter = (f: FilterRow): boolean => {
    if (!f.property) return false;
    const config = getOpConfig(f.operation);
    if (!config) return false;
    if (config.params.includes('value') && !f.value) return false;
    if (config.params.includes('start') && !f.start) return false;
    if (config.params.includes('end') && !f.end) return false;
    if (config.params.includes('values') && !f.values) return false;
    return true;
  };

  const validFilters = filters.filter(isValidFilter);

  const formatFilterPreview = (f: FilterRow): string => {
    const config = getOpConfig(f.operation);
    if (!config) return '';
    const symbol = getOperationSymbol(f.operation);

    if (config.params.includes('value')) {
      return `${f.property} ${symbol} ${f.value}`;
    }
    if (config.params.includes('start')) {
      return `${f.start} ${symbol} ${f.property} ${symbol} ${f.end}`;
    }
    if (config.params.includes('values')) {
      return `${f.property} ${symbol} [${f.values}]`;
    }
    return `${f.property} ${symbol}`;
  };

  const previewText = validFilters.map(formatFilterPreview).join(', ');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="min-w-[100px] flex-1">
        <label className="text-sm font-medium mb-1.5 block">Filters</label>
        <SheetTrigger asChild>
          <button
            type="button"
            className="w-full h-10 flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted/50 transition-colors text-left"
          >
            {validFilters.length > 0 ? (
              <span className="font-mono text-xs truncate">{previewText}</span>
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </button>
        </SheetTrigger>
      </div>

      <SheetContent className="w-[500px] sm:max-w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {filters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No filters added. Click "Add filter" to start.
            </p>
          ) : (
            filters.map((filter) => {
              const config = getOpConfig(filter.operation);
              return (
                <div
                  key={filter.id}
                  className="border rounded-lg p-3 space-y-3 bg-muted/30"
                >
                  {/* Property and Operation row */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Property
                      </label>
                      <Input
                        value={filter.property}
                        onChange={(e) =>
                          updateFilter(filter.id, { property: e.target.value })
                        }
                        placeholder="propertyName"
                        className="font-mono h-9"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Operation
                      </label>
                      <Select
                        value={filter.operation}
                        onValueChange={(v) =>
                          updateFilter(filter.id, { operation: v as FilterOperation })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILTER_OPERATIONS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 mt-5 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Value inputs based on operation */}
                  {config?.params.includes('value') && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Value
                      </label>
                      <Input
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(filter.id, { value: e.target.value })
                        }
                        placeholder="value"
                        className="font-mono h-9"
                      />
                    </div>
                  )}

                  {config?.params.includes('start') && config?.params.includes('end') && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Start
                        </label>
                        <Input
                          value={filter.start}
                          onChange={(e) =>
                            updateFilter(filter.id, { start: e.target.value })
                          }
                          placeholder="start"
                          className="font-mono h-9"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          End
                        </label>
                        <Input
                          value={filter.end}
                          onChange={(e) =>
                            updateFilter(filter.id, { end: e.target.value })
                          }
                          placeholder="end"
                          className="font-mono h-9"
                        />
                      </div>
                    </div>
                  )}

                  {config?.params.includes('values') && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Values (comma-separated)
                      </label>
                      <Input
                        value={filter.values}
                        onChange={(e) =>
                          updateFilter(filter.id, { values: e.target.value })
                        }
                        placeholder="value1, value2, value3"
                        className="font-mono h-9"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t pt-4">
          <Button onClick={addFilter} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
