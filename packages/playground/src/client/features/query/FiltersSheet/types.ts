import type { FilterOperation } from './constants';

export interface FilterRow {
  id: string;
  property: string;
  operation: FilterOperation;
  value: string;
  start: string;
  end: string;
  values: string;
}

export function createEmptyFilter(): FilterRow {
  return {
    id: crypto.randomUUID(),
    property: '',
    operation: 'equal',
    value: '',
    start: '',
    end: '',
    values: '',
  };
}
