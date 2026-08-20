import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { AtomicOperationRow } from './types';
import { ATOMIC_OPERATIONS, type AtomicOperationType } from './constants';
import { PropertySelect } from './PropertySelect';
import { SectionHeader } from './SectionHeader';
import { createId, validateJson } from './helpers';

interface AtomicOperationsSectionProps {
  rows: AtomicOperationRow[];
  properties: string[];
  usedProperties: Set<string>;
  onChange: (rows: AtomicOperationRow[]) => void;
}

export function AtomicOperationsSection({
  rows,
  properties,
  usedProperties,
  onChange,
}: AtomicOperationsSectionProps) {
  const addRow = () => {
    onChange([...rows, { id: createId(), type: 'add', property: '', isCustom: false, value: '' }]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<AtomicOperationRow>) => {
    onChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        if ('value' in updates) {
          const validation = validateJson(updates.value || '');
          updated.jsonError = validation.error;
        }
        return updated;
      }),
    );
  };

  const getAtomicConfig = (type: AtomicOperationType) => {
    return ATOMIC_OPERATIONS.find((op) => op.value === type);
  };

  return (
    <div>
      <SectionHeader title="Atomic Operations" count={rows.length} onAdd={addRow} addLabel="Add" />
      {rows.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">No atomic operations.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const opConfig = getAtomicConfig(row.type);
            const isSetOperation = row.type === 'add_to_set' || row.type === 'remove_from_set';

            return (
              <div key={row.id} className="space-y-2 rounded border bg-background p-2">
                <div className="flex items-start gap-2">
                  <div className="w-[140px]">
                    <Select
                      value={row.type}
                      onValueChange={(v) => updateRow(row.id, { type: v as AtomicOperationType })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATOMIC_OPERATIONS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <PropertySelect
                      properties={properties}
                      usedProperties={usedProperties}
                      value={row.property}
                      isCustom={row.isCustom}
                      currentProperty={row.property}
                      onValueChange={(value, isCustom) =>
                        updateRow(row.id, { property: value, isCustom })
                      }
                      placeholder="Property"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Textarea
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    placeholder={isSetOperation ? '["a", "b"]' : '1'}
                    className={`h-9 min-h-[36px] resize-none py-2 font-mono ${
                      row.jsonError ? 'border-destructive' : ''
                    }`}
                  />
                  <div className="mt-0.5 flex items-center justify-between">
                    {row.jsonError ? (
                      <span className="text-[10px] text-destructive">{row.jsonError}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {opConfig?.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
