/* eslint-disable no-restricted-syntax */
import { useState, useMemo } from 'react';
import { Plus, Trash2, Key, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Constants
const CONDITION_OPERATIONS = [
  { value: 'equal', label: 'Equal', params: ['value'] },
  { value: 'not_equal', label: 'Not equal', params: ['value'] },
  { value: 'lower_than', label: 'Lower than', params: ['value'] },
  { value: 'lower_or_equal_than', label: 'Lower or equal', params: ['value'] },
  { value: 'bigger_than', label: 'Bigger than', params: ['value'] },
  { value: 'bigger_or_equal_than', label: 'Bigger or equal', params: ['value'] },
  { value: 'begins_with', label: 'Begins with', params: ['value'] },
  { value: 'contains', label: 'Contains', params: ['value'] },
  { value: 'not_contains', label: 'Not contains', params: ['value'] },
  { value: 'between', label: 'Between', params: ['start', 'end'] },
  { value: 'in', label: 'In', params: ['values'] },
  { value: 'not_in', label: 'Not in', params: ['values'] },
  { value: 'exists', label: 'Exists', params: [] },
  { value: 'not_exists', label: 'Not exists', params: [] },
] as const;

const ATOMIC_OPERATIONS = [
  { value: 'add', label: 'Add', description: 'Treats missing value as 0' },
  { value: 'sum', label: 'Sum', description: 'Requires prop to be set' },
  { value: 'subtract', label: 'Subtract', description: 'Requires prop to be set' },
  { value: 'add_to_set', label: 'Add to Set', description: 'Adds values to a set' },
  { value: 'remove_from_set', label: 'Remove from Set', description: 'Removes from set' },
  {
    value: 'set_if_not_exists',
    label: 'Set if not exists',
    description: 'Only if missing',
  },
] as const;

type ConditionOperation = (typeof CONDITION_OPERATIONS)[number]['value'];
type AtomicOperationType = (typeof ATOMIC_OPERATIONS)[number]['value'];

const getOpConfig = (op: ConditionOperation) => {
  type OpConfig = Omit<(typeof CONDITION_OPERATIONS)[number], 'params'> & {
    params: Array<'value' | 'start' | 'end' | 'values'>;
  };

  return CONDITION_OPERATIONS.find((o) => o.value === op) as OpConfig | undefined;
};

// Row types
interface ValueRow {
  id: string;
  property: string;
  isCustom: boolean;
  value: string;
  jsonError?: string;
}

interface RemoveRow {
  id: string;
  property: string;
  isCustom: boolean;
}

interface AtomicOperationRow {
  id: string;
  type: AtomicOperationType;
  property: string;
  isCustom: boolean;
  value: string;
  jsonError?: string;
}

interface ConditionRow {
  id: string;
  property: string;
  isCustom: boolean;
  operation: ConditionOperation;
  value: string;
  start: string;
  end: string;
  values: string;
  joinAs: 'and' | 'or';
}

// Props
interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Record<string, unknown>;
  entityType: string;
  onSubmit: (params: UpdateParams) => void;
  isLoading?: boolean;
}

export interface UpdateParams {
  values?: Record<string, unknown>;
  remove?: string[];
  atomicOperations?: Array<{
    type: string;
    property: string;
    value?: unknown;
    values?: unknown[];
  }>;
  conditions?: Array<{
    operation: string;
    property: string;
    value?: unknown;
    start?: unknown;
    end?: unknown;
    values?: unknown[];
    joinAs?: 'and' | 'or';
  }>;
}

// Helper functions
function createId(): string {
  return crypto.randomUUID();
}

function getPropertyKeys(item: Record<string, unknown>): string[] {
  return Object.keys(item).filter(
    (key) => !['_pk', '_sk', '_type', '_c', '_m'].includes(key),
  );
}

function validateJson(value: string): {
  valid: boolean;
  error?: string;
  parsed?: unknown;
} {
  if (!value.trim()) {
    return { valid: false, error: 'Value is required' };
  }
  try {
    const parsed = JSON.parse(value);
    return { valid: true, parsed };
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }
}

function parseValue(str: string): unknown {
  if (str === 'null') return null;
  if (str === 'true') return true;
  if (str === 'false') return false;
  const num = Number(str);
  if (!Number.isNaN(num) && str.trim() !== '') return num;
  return str;
}

function formatJsonPreview(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// PropertySelect Component
interface PropertySelectProps {
  properties: string[];
  usedProperties: Set<string>;
  value: string;
  isCustom: boolean;
  onValueChange: (value: string, isCustom: boolean) => void;
  placeholder?: string;
  currentProperty?: string;
}

function PropertySelect({
  properties,
  usedProperties,
  value,
  isCustom,
  onValueChange,
  placeholder = 'Select property',
  currentProperty,
}: PropertySelectProps) {
  const availableProperties = properties.filter(
    (p) => p === currentProperty || !usedProperties.has(p),
  );

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value, true)}
          placeholder="Custom property"
          className="font-mono h-9 flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-xs"
          onClick={() => onValueChange('', false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === '__custom__') {
          onValueChange('', true);
        } else {
          onValueChange(v, false);
        }
      }}
    >
      <SelectTrigger className="h-9 font-mono">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {availableProperties.map((prop) => (
          <SelectItem key={prop} value={prop} className="font-mono">
            {prop}
          </SelectItem>
        ))}
        {availableProperties.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No available properties
          </div>
        )}
        <SelectItem value="__custom__" className="text-muted-foreground italic">
          Custom...
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
}

function SectionHeader({ title, count, onAdd, addLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {count > 0 && (
          <Badge variant="secondary" className="text-xs h-5">
            {count}
          </Badge>
        )}
      </div>
      <Button onClick={onAdd} variant="ghost" size="sm" className="h-7 text-xs">
        <Plus className="h-3 w-3 mr-1" />
        {addLabel}
      </Button>
    </div>
  );
}

// Section Components
interface ValuesSectionProps {
  rows: ValueRow[];
  properties: string[];
  usedProperties: Set<string>;
  onChange: (rows: ValueRow[]) => void;
}

function ValuesSection({
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

interface RemoveSectionProps {
  rows: RemoveRow[];
  properties: string[];
  usedProperties: Set<string>;
  onChange: (rows: RemoveRow[]) => void;
}

function RemoveSection({
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

interface AtomicOperationsSectionProps {
  rows: AtomicOperationRow[];
  properties: string[];
  usedProperties: Set<string>;
  onChange: (rows: AtomicOperationRow[]) => void;
}

function AtomicOperationsSection({
  rows,
  properties,
  usedProperties,
  onChange,
}: AtomicOperationsSectionProps) {
  const addRow = () => {
    onChange([
      ...rows,
      { id: createId(), type: 'add', property: '', isCustom: false, value: '' },
    ]);
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
      <SectionHeader
        title="Atomic Operations"
        count={rows.length}
        onAdd={addRow}
        addLabel="Add"
      />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No atomic operations.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const opConfig = getAtomicConfig(row.type);
            const isSetOperation =
              row.type === 'add_to_set' || row.type === 'remove_from_set';

            return (
              <div key={row.id} className="p-2 border rounded bg-background space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="w-[140px]">
                    <Select
                      value={row.type}
                      onValueChange={(v) =>
                        updateRow(row.id, { type: v as AtomicOperationType })
                      }
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
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
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
                    className={`font-mono min-h-[36px] h-9 py-2 resize-none ${
                      row.jsonError ? 'border-destructive' : ''
                    }`}
                  />
                  <div className="flex justify-between items-center mt-0.5">
                    {row.jsonError ? (
                      <span className="text-[10px] text-destructive">
                        {row.jsonError}
                      </span>
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

interface ConditionsSectionProps {
  rows: ConditionRow[];
  properties: string[];
  onChange: (rows: ConditionRow[]) => void;
}

function ConditionsSection({ rows, properties, onChange }: ConditionsSectionProps) {
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
interface ChangesPreviewProps {
  valueRows: ValueRow[];
  removeRows: RemoveRow[];
  atomicRows: AtomicOperationRow[];
  conditionRows: ConditionRow[];
}

function ChangesPreview({
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
        const isSetOperation =
          row.type === 'add_to_set' || row.type === 'remove_from_set';
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
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Update Item
            <Badge variant="secondary" className="font-mono text-xs">
              {entityType}
            </Badge>
          </DialogTitle>
          {/* Item Keys */}
          {resolvedKeys?.success && (
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">PK:</span>
                <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                  {resolvedKeys.partitionKey}
                </code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">SK:</span>
                <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                  {resolvedKeys.rangeKey}
                </code>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form Section */}
          <ScrollArea className="flex-1 border-r">
            <div className="p-4 flex flex-col gap-3">
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
          <div className="w-[280px] bg-muted/20 p-4 overflow-y-auto">
            <ChangesPreview
              valueRows={valueRows}
              removeRows={removeRows}
              atomicRows={atomicRows}
              conditionRows={conditionRows}
            />
            {!hasContent && (
              <div className="text-xs text-muted-foreground text-center py-8">
                Add changes to see a preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0">
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
