/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';
import { ensureArray } from 'utils/array';

export function toKeyPrefix(rangeGetter?: (...p: any) => KeyValue) {
  if (!rangeGetter) return [];

  const keyResult = rangeGetter({});

  if (!keyResult) return [];

  const asList = ensureArray(keyResult);

  const firstInvalidIndex = asList.findIndex((x) => !x);

  // If no invalid index found (-1), return all elements
  // Otherwise, return slice up to (but not including) the invalid index
  return firstInvalidIndex === -1 ? asList : asList.slice(0, firstInvalidIndex);
}
