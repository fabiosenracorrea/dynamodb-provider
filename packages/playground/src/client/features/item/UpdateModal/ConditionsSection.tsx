import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ConditionRow } from './types';
import { CONDITION_OPERATIONS, getOpConfig } from './constants';
import type { ConditionOperation } from './constants';
import { PropertySelect } from './PropertySelect';
import { SectionHeader } from './SectionHeader';
import { createId, validateJson } from './helpers';

interface ConditionsSectionProps {
  rows: ConditionRow[];
  properties: string[];
  onChange: (rows: ConditionRow[]) => void;
}

export function ConditionsSection({ rows, properties, onChange }: ConditionsSectionProps) {
  const addRow = () => {
    onChange([
      ...rows,
      {
        id: createId(),
        property: '',
        isCustom: false,
        operation: 'equal',
        value: '',
        start: '',
        end: '',
        values: '',
        joinAs: 'and',
      },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<ConditionRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return (
    <div>
      <SectionHeader
        title="Conditions"
        count={rows.length}
        onAdd={addRow}
        addLabel="Add"
      />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          No conditions. Operations will apply unconditionally.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, idx) => {
            const config = getOpConfig(row.operation);
            return (
              <div key={row.id} className="p-1 bg-background space-y-2">
                {idx > 0 && (
                  <div className="flex items-center gap-2 pb-1">
                    <Select
                      value={row.joinAs}
                      onValueChange={(v) =>
                        updateRow(row.id, { joinAs: v as 'and' | 'or' })
                      }
                    >
                      <SelectTrigger className="h-6 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND</SelectItem>
                        <SelectItem value="or">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <PropertySelect
                      properties={properties}
                      usedProperties={new Set()}
                      value={row.property}
                      isCustom={row.isCustom}
                      onValueChange={(value, isCustom) =>
                        updateRow(row.id, { property: value, isCustom })
                      }
                      placeholder="Property"
                    />
                  </div>
                  <div className="w-[130px]">
                    <Select
                      value={row.operation}
                      onValueChange={(v) =>
                        updateRow(row.id, { operation: v as ConditionOperation })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATIONS.map((op) => (
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
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {config?.params.includes('value') && (
                  <Input
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    placeholder="value"
                    className="font-mono h-9"
                  />
                )}

                {config?.params.includes('start') && config?.params.includes('end') && (
                  <div className="flex gap-2">
                    <Input
                      value={row.start}
                      onChange={(e) => updateRow(row.id, { start: e.target.value })}
                      placeholder="start"
                      className="font-mono h-9"
                    />
                    <Input
                      value={row.end}
                      onChange={(e) => updateRow(row.id, { end: e.target.value })}
                      placeholder="end"
                      className="font-mono h-9"
                    />
                  </div>
                )}

                {config?.params.includes('values') && (
                  <Input
                    value={row.values}
                    onChange={(e) => updateRow(row.id, { values: e.target.value })}
                    placeholder="value1, value2, value3"
                    className="font-mono h-9"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Changes Preview Component
