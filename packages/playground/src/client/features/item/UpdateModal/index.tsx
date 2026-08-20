import { useState, useMemo } from 'react';
import { Key } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useResolveEntityKeys } from '@/utils/hooks';

import type { AtomicOperationRow, ConditionRow, RemoveRow, UpdateParams, ValueRow } from './types';
import { getOpConfig } from './constants';
import { getPropertyKeys, parseValue } from './helpers';
import { ValuesSection } from './ValuesSection';
import { RemoveSection } from './RemoveSection';
import { AtomicOperationsSection } from './AtomicOperationsSection';
import { ConditionsSection } from './ConditionsSection';
import { ChangesPreview } from './ChangesPreview';

export type { UpdateParams };

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Record<string, unknown>;
  entityType: string;
  onSubmit: (params: UpdateParams) => void;
  isLoading?: boolean;
}

export function UpdateModal({
  open,
  onOpenChange,
  item,
  entityType,
  onSubmit,
  isLoading,
}: UpdateModalProps) {
  const [valueRows, setValueRows] = useState<ValueRow[]>([]);
  const [removeRows, setRemoveRows] = useState<RemoveRow[]>([]);
  const [atomicRows, setAtomicRows] = useState<AtomicOperationRow[]>([]);
  const [conditionRows, setConditionRows] = useState<ConditionRow[]>([]);

  const [resolvedKeys] = useResolveEntityKeys(entityType, item);

  const properties = useMemo(() => getPropertyKeys(item), [item]);

  // Track used properties across values, remove, and atomic operations
  const usedProperties = useMemo(() => {
    const used = new Set<string>();
    valueRows.forEach((r) => r.property && !r.isCustom && used.add(r.property));
    removeRows.forEach((r) => r.property && !r.isCustom && used.add(r.property));
    atomicRows.forEach((r) => r.property && !r.isCustom && used.add(r.property));
    return used;
  }, [valueRows, removeRows, atomicRows]);

  const hasErrors = useMemo(() => {
    return valueRows.some((r) => r.jsonError) || atomicRows.some((r) => r.jsonError);
  }, [valueRows, atomicRows]);

  const hasContent = useMemo(() => {
    const validValues = valueRows.filter((r) => r.property && !r.jsonError && r.value);
    const validRemove = removeRows.filter((r) => r.property);
    const validAtomic = atomicRows.filter((r) => r.property && !r.jsonError && r.value);
    return validValues.length > 0 || validRemove.length > 0 || validAtomic.length > 0;
  }, [valueRows, removeRows, atomicRows]);

  const handleSubmit = () => {
    if (hasErrors || !hasContent) return;

    const params: UpdateParams = {};

    // Build values
    const validValues = valueRows.filter((r) => r.property && !r.jsonError && r.value);
    if (validValues.length > 0) {
      params.values = {};
      for (const row of validValues) {
        try {
          params.values[row.property] = JSON.parse(row.value);
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Build remove
    const validRemove = removeRows.filter((r) => r.property);
    if (validRemove.length > 0) {
      params.remove = validRemove.map((r) => r.property);
    }

    // Build atomicOperations
    const validAtomic = atomicRows.filter((r) => r.property && !r.jsonError && r.value);
    if (validAtomic.length > 0) {
      params.atomicOperations = validAtomic.map((row) => {
        const isSetOperation = row.type === 'add_to_set' || row.type === 'remove_from_set';
        try {
          const parsedValue = JSON.parse(row.value);
          if (isSetOperation) {
            return {
              type: row.type,
              property: row.property,
              values: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
            };
          }
          return {
            type: row.type,
            property: row.property,
            value: parsedValue,
          };
        } catch {
          return {
            type: row.type,
            property: row.property,
            value: row.value,
          };
        }
      });
    }

    // Build conditions
    const validConditions = conditionRows.filter((r) => {
      if (!r.property) return false;
      const config = getOpConfig(r.operation);
      if (!config) return false;
      if (config.params.includes('value') && !r.value) return false;
      if (config.params.includes('start') && !r.start) return false;
      if (config.params.includes('end') && !r.end) return false;
      if (config.params.includes('values') && !r.values) return false;
      return true;
    });
    if (validConditions.length > 0) {
      params.conditions = validConditions.map((row, idx) => {
        const config = getOpConfig(row.operation);

        const condition: NonNullable<UpdateParams['conditions']>[number] = {
          operation: row.operation,
          property: row.property,
        };

        if (idx > 0) {
          condition.joinAs = row.joinAs;
        }

        if (config?.params.includes('value')) {
          condition.value = parseValue(row.value);
        }
        if (config?.params.includes('start')) {
          condition.start = parseValue(row.start);
          condition.end = parseValue(row.end);
        }
        if (config?.params.includes('values')) {
          condition.values = row.values.split(',').map((v) => parseValue(v.trim()));
        }

        return condition;
      });
    }

    onSubmit(params);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state on close
      setValueRows([]);
      setRemoveRows([]);
      setAtomicRows([]);
      setConditionRows([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            Update Item
            <Badge variant="secondary" className="font-mono text-xs">
              {entityType}
            </Badge>
          </DialogTitle>
          {/* Item Keys */}
          {resolvedKeys?.success && (
            <div className="mt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">PK:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  {resolvedKeys.partitionKey}
                </code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">SK:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  {resolvedKeys.rangeKey}
                </code>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Form Section */}
          <ScrollArea className="flex-1 border-r">
            <div className="flex flex-col gap-3 p-4">
              <ValuesSection
                rows={valueRows}
                properties={properties}
                usedProperties={usedProperties}
                onChange={setValueRows}
              />
              <RemoveSection
                rows={removeRows}
                properties={properties}
                usedProperties={usedProperties}
                onChange={setRemoveRows}
              />
              <AtomicOperationsSection
                rows={atomicRows}
                properties={properties}
                usedProperties={usedProperties}
                onChange={setAtomicRows}
              />
              <ConditionsSection
                rows={conditionRows}
                properties={properties}
                onChange={setConditionRows}
              />
            </div>
          </ScrollArea>

          {/* Preview Section */}
          <div className="w-[280px] overflow-y-auto bg-muted/20 p-4">
            <ChangesPreview
              valueRows={valueRows}
              removeRows={removeRows}
              atomicRows={atomicRows}
              conditionRows={conditionRows}
            />
            {!hasContent && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Add changes to see a preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || hasErrors || !hasContent}>
            {isLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
