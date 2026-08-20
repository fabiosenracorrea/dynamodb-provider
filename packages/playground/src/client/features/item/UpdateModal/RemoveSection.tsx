import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { RemoveRow } from './types';
import { PropertySelect } from './PropertySelect';
import { SectionHeader } from './SectionHeader';
import { createId, validateJson } from './helpers';

interface RemoveSectionProps {
  rows: RemoveRow[];
  properties: string[];
  usedProperties: Set<string>;
  onChange: (rows: RemoveRow[]) => void;
}

export function RemoveSection({
  rows,
  properties,
  usedProperties,
  onChange,
}: RemoveSectionProps) {
  const addRow = () => {
    onChange([...rows, { id: createId(), property: '', isCustom: false }]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<RemoveRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return (
    <div>
      <SectionHeader
        title="Remove Properties"
        count={rows.length}
        onAdd={addRow}
        addLabel="Add"
      />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No properties to remove.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex gap-2 items-center p-2 border rounded bg-background"
            >
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
                  placeholder="Property to remove"
                />
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
