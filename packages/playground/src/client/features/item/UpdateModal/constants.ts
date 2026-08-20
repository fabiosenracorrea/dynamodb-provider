export const CONDITION_OPERATIONS = [
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

export const ATOMIC_OPERATIONS = [
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

export type ConditionOperation = (typeof CONDITION_OPERATIONS)[number]['value'];
export type AtomicOperationType = (typeof ATOMIC_OPERATIONS)[number]['value'];

export const getOpConfig = (op: ConditionOperation) => {
  type OpConfig = Omit<(typeof CONDITION_OPERATIONS)[number], 'params'> & {
    params: Array<'value' | 'start' | 'end' | 'values'>;
  };

  return CONDITION_OPERATIONS.find((o) => o.value === op) as OpConfig | undefined;
};
