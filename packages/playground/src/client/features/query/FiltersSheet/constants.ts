export const FILTER_OPERATIONS = [
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

export type FilterOperation = (typeof FILTER_OPERATIONS)[number]['value'];

export const getOpConfig = (op: FilterOperation) => {
  type OpConfig = Omit<(typeof FILTER_OPERATIONS)[number], 'params'> & {
    params: Array<'value' | 'start' | 'end' | 'values'>;
  };

  return FILTER_OPERATIONS.find((o) => o.value === op) as OpConfig | undefined;
};

// Parse string to appropriate type (number, boolean, null, or string)
export function parseValue(str: string): string | number | boolean | null {
  if (str === 'null') return null;
  if (str === 'true') return true;
  if (str === 'false') return false;
  const num = Number(str);
  if (!Number.isNaN(num) && str.trim() !== '') return num;
  return str;
}
