import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { ValueRow } from './types';
import { PropertySelect } from './PropertySelect';
import { SectionHeader } from './SectionHeader';
import { createId, validateJson } from './helpers';

interface ValuesSectionProps {
  rows: ValueRow[];
  properties: string[];
  usedProperties: Set<string>;
  onChange: (rows: ValueRow[]) => void;
}

export function ValuesSection({
  rows,
  properties,
  usedProperties,
  onChange,
}: ValuesSectionProps) {
  const addRow = () => {
    onChange([...rows, { id: createId(), property: '', isCustom: false, value: '' }]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<ValueRow>) => {
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

  return (
    <div className="space-y-2">
      <SectionHeader
        title="Set Values"
        count={rows.length}
        onAdd={addRow}
        addLabel="Add"
      />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No values to set.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex gap-2 items-start p-2 border rounded bg-background"
            >
              <div className="flex-1 min-w-[120px]">
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
              <div className="flex-[2]">
                <Textarea
                  value={row.value}
                  onChange={(e) => updateRow(row.id, { value: e.target.value })}
                  placeholder='JSON value: "text", 123, true, {...}'
                  className={`font-mono min-h-[40px] h-9 py-2 resize-y ${
                    row.jsonError ? 'border-destructive' : ''
                  }`}
                />
                {row.jsonError && (
                  <span className="text-[10px] text-destructive">{row.jsonError}</span>
                )}
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
          ))}
        </div>
      )}
    </div>
  );
}
