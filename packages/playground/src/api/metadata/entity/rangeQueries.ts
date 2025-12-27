/* eslint-disable @typescript-eslint/no-explicit-any */
// metadata/inferRangeQueries.ts
import type { RangeQuery } from '../../types';
import { inferParams } from './inferParams';

type RangeQueryFn = (params?: any) => { operation: string; [k: string]: any };

type RangeQueriesRecord = Record<string, RangeQueryFn>;

export function inferRangeQueries(rangeQueries?: RangeQueriesRecord): RangeQuery[] {
  if (!rangeQueries) return [];

  return Object.entries(rangeQueries).map(([name, fn]) => {
    const params = inferParams(fn);

    // also run it once to capture operation
    let operation = 'unknown';

    try {
      const result = fn({});

      if (result.operation) operation = result.operation;
    } catch {
      // keep "unknown"
    }

    return { name, operation, params };
  });
}
