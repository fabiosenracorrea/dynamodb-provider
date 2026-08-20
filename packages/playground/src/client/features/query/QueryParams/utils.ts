import type { RangeQuery } from '@/utils/api';

import { QueryConfig } from './queryConfig.hook';
import { AnyObject } from '@/types';

export const RANGE_OPERATIONS = [
  { value: 'equal', label: 'Equal', params: ['value'] },
  { value: 'lower_than', label: 'Lower than', params: ['value'] },
  { value: 'lower_or_equal_than', label: 'Lower or equal', params: ['value'] },
  { value: 'bigger_than', label: 'Bigger than', params: ['value'] },
  { value: 'bigger_or_equal_than', label: 'Bigger or equal', params: ['value'] },
  { value: 'begins_with', label: 'Begins with', params: ['value'] },
  { value: 'between', label: 'Between', params: ['start', 'end'] },
] as const;

export interface BuiltRangeParams {
  /**
   * Name of the declared range query to invoke. Travels as its own field on the
   * request — the server dispatches on it, so burying it in `params` meant the
   * query silently ran unfiltered.
   */
  rangeQuery?: string;
  params: AnyObject;
}

function pickFilled(source: Record<string, string>, keys: string[]): AnyObject {
  return Object.fromEntries(
    keys.filter((key) => source[key]?.trim()).map((key) => [key, source[key]]),
  );
}

export function buildRangeParams(
  { mode, operation, params }: QueryConfig['range'],
  rangeQueries: RangeQuery[] = [],
): BuiltRangeParams {
  const selectedRangeQuery = rangeQueries.find((rq) => rq.name === mode);

  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === operation);

  const isCustomMode = mode === 'custom';
  const isPredefinedMode = mode !== 'none' && mode !== 'custom';

  if (isPredefinedMode && selectedRangeQuery) {
    return {
      rangeQuery: mode,
      params: pickFilled(params, selectedRangeQuery.params),
    };
  }

  if (isCustomMode && selectedCustomOp) {
    return {
      params: {
        range: { operation, ...pickFilled(params, [...selectedCustomOp.params]) },
      },
    };
  }

  return { params: {} };
}

export function isRangeQueryValid(
  { mode, operation, params }: QueryConfig['range'],
  rangeQueries: RangeQuery[] = [],
) {
  const selectedRangeQuery = rangeQueries.find((rq) => rq.name === mode);
  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === operation);
  const isCustomMode = mode === 'custom';
  const isPredefinedMode = mode !== 'none' && mode !== 'custom';

  // `params[p]?.trim() !== ''` passed for missing values: optional chaining yields
  // undefined, and undefined !== ''. Every required param has to be truthy.
  const isPredefinedRangeValid =
    !isPredefinedMode ||
    !selectedRangeQuery ||
    selectedRangeQuery.params.every((p) => !!params[p]?.trim());

  const isCustomRangeValid =
    !isCustomMode ||
    !selectedCustomOp ||
    selectedCustomOp.params.every((p) => !!params[p]?.trim());

  if (isPredefinedMode) return isPredefinedRangeValid;

  if (isCustomMode) return isCustomRangeValid;

  return true;
}
