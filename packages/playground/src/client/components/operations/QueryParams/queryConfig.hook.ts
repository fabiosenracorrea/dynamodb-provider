import { useMultiState } from '@/hooks/multiState';
import { FilterRow } from '../FiltersSheet';
import { OrString } from '@/types';

export interface QueryConfig {
  retrieveOrder: 'ASC' | 'DESC';
  limit: string;
  fullRetrieval: boolean;
  filters: FilterRow[];

  range: {
    // string = custom range query
    mode: OrString<'none' | 'custom'>;
    operation: string;
    params: Record<string, string>;
  };
}

export function useQueryConfig() {
  const { values, ...handlers } = useMultiState<QueryConfig>({
    filters: [],
    fullRetrieval: false,
    limit: '25',
    retrieveOrder: 'ASC',

    range: {
      mode: 'none',
      operation: 'begins_with',
      params: {},
    },
  });

  return [values, handlers] as const;
}

export type QueryConfigHandlers = ReturnType<typeof useQueryConfig>[1];
