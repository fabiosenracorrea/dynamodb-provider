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

export function buildRangeParams(
  { mode, operation, params }: QueryConfig['range'],
  rangeQueries: RangeQuery[] = [],
) {
  // to do: strictly type
  const resultParams: AnyObject = {};

  const selectedRangeQuery = rangeQueries.find((rq) => rq.name === mode);

  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === operation);

  const isCustomMode = mode === 'custom';
  const isPredefinedMode = mode !== 'none' && mode !== 'custom';

  if (isPredefinedMode && selectedRangeQuery) {
    resultParams.rangeQuery = mode;

    selectedRangeQuery.params.forEach((paramName) => {
      if (params[paramName]) {
        resultParams[paramName] = params[paramName];
      }
    });

    return resultParams;
  }

  if (isCustomMode && selectedCustomOp) {
    const range: Record<string, unknown> = { operation };

    selectedCustomOp.params.forEach((param) => {
      if (params[param]) {
        range[param] = params[param];
      }
    });

    resultParams.range = range;

    return resultParams;
  }
}

export function isRangeQueryValid(
  { mode, operation, params }: QueryConfig['range'],
  rangeQueries: RangeQuery[] = [],
) {
  const selectedRangeQuery = rangeQueries.find((rq) => rq.name === mode);
  const selectedCustomOp = RANGE_OPERATIONS.find((op) => op.value === operation);
  const isCustomMode = mode === 'custom';
  const isPredefinedMode = mode !== 'none' && mode !== 'custom';

  const isPredefinedRangeValid =
    !isPredefinedMode ||
    !selectedRangeQuery ||
    selectedRangeQuery.params.every((p) => params[p]?.trim() !== '');

  const isCustomRangeValid =
    !isCustomMode ||
    !selectedCustomOp ||
    selectedCustomOp.params.every((p) => params[p]?.trim() !== '');

  if (isPredefinedMode) return isPredefinedRangeValid;

  if (isCustomMode) return isCustomRangeValid;

  return true;
}
