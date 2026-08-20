import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import type { AtomicOperationRow, ConditionRow, RemoveRow, ValueRow } from './types';
import { ATOMIC_OPERATIONS, CONDITION_OPERATIONS, getOpConfig } from './constants';
import { formatJsonPreview, parseValue, validateJson } from './helpers';

interface ChangesPreviewProps {
  valueRows: ValueRow[];
  removeRows: RemoveRow[];
  atomicRows: AtomicOperationRow[];
  conditionRows: ConditionRow[];
}

export function ChangesPreview({
  valueRows,
  removeRows,
  atomicRows,
  conditionRows,
}: ChangesPreviewProps) {
  const validValues = valueRows.filter((r) => r.property && !r.jsonError && r.value);
  const validRemove = removeRows.filter((r) => r.property);
  const validAtomic = atomicRows.filter((r) => r.property && !r.jsonError && r.value);
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

  const hasChanges =
    validValues.length > 0 || validRemove.length > 0 || validAtomic.length > 0;

  if (!hasChanges && validConditions.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Changes Summary
      </h4>

      {validValues.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            SET
          </span>
          <div className="space-y-0.5">
            {validValues.map((row) => {
              let parsed: unknown;
              try {
                parsed = JSON.parse(row.value);
              } catch {
                parsed = row.value;
              }
              return (
                <div key={row.id} className="flex items-center gap-1 text-xs font-mono">
                  <span className="text-foreground">{row.property}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {formatJsonPreview(parsed)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {validRemove.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            REMOVE
          </span>
          <div className="flex flex-wrap gap-1">
            {validRemove.map((row) => (
              <Badge key={row.id} variant="outline" className="font-mono text-xs">
                {row.property}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {validAtomic.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            ATOMIC
          </span>
          <div className="space-y-0.5">
            {validAtomic.map((row) => {
              const opConfig = ATOMIC_OPERATIONS.find((o) => o.value === row.type);
              return (
                <div key={row.id} className="flex items-center gap-1 text-xs font-mono">
                  <Badge variant="secondary" className="text-[10px]">
                    {opConfig?.label}
                  </Badge>
                  <span className="text-foreground">{row.property}</span>
                  <span className="text-muted-foreground">({row.value})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {validConditions.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            IF
          </span>
          <div className="space-y-0.5">
            {validConditions.map((row, idx) => {
              const opConfig = CONDITION_OPERATIONS.find(
                (o) => o.value === row.operation,
              );
              return (
                <div key={row.id} className="flex items-center gap-1 text-xs font-mono">
                  {idx > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {row.joinAs}
                    </Badge>
                  )}
                  <span className="text-foreground">{row.property}</span>
                  <span className="text-muted-foreground">{opConfig?.label}</span>
                  {row.value && (
                    <span className="text-muted-foreground">{row.value}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
