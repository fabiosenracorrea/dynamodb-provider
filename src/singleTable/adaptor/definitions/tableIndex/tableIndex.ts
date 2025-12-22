import { ensureArray } from 'utils/array';
import { isNonNullable } from 'utils/checkers';
import { omitUndefined } from 'utils/object';

import { StableOmit } from 'types';
import { SingleTableConfig } from '../config';
import { convertKey, KeyValue, SingleTableKeyReference } from '../key';

type IndexGenParams = Partial<SingleTableKeyReference> & {
  /**
   * Index name
   */
  index: string;

  config: SingleTableConfig;
};

export function getIndexHashName(index: string, config: SingleTableConfig): string {
  return config.indexes?.[index].partitionKey as string;
}

export function getIndexRangeName(index: string, config: SingleTableConfig): string {
  return config.indexes?.[index].rangeKey as string;
}

function isInvalidKey(key?: KeyValue): boolean {
  if (!key || !key.length) return true;

  const asArray = ensureArray(key);

  return asArray.some((x) => !isNonNullable(x));
}

function getRangeKey({
  config,
  index,
  rangeKey,
}: StableOmit<IndexGenParams, 'partitionKey'>) {
  const { numeric } = config.indexes![index];

  // Same behavior as partitionKey
  if (!numeric) return isInvalidKey(rangeKey) ? undefined : convertKey(rangeKey!, config);

  if (!rangeKey || !rangeKey.length) return;

  const [value, ...rest] = ensureArray(rangeKey);

  const invalid = typeof value !== 'number' || !!rest.length;

  // add a config to throw here?
  if (invalid) return;

  return value;
}

function getIndexRecord({
  index,
  partitionKey,
  rangeKey,
  config,
}: IndexGenParams): Record<string, string> {
  const [hashName, rangeName] = [getIndexHashName, getIndexRangeName].map((cb) =>
    cb(index, config),
  );

  const hashValue = isInvalidKey(partitionKey)
    ? undefined
    : convertKey(partitionKey!, config);

  const rangeValue = getRangeKey({ rangeKey, index, config });

  return omitUndefined({
    [hashName]: hashValue,

    [rangeName]: rangeValue,
  }) as Record<string, string>;
}

type IndexRef = Record<string, Partial<SingleTableKeyReference>>;

export function transformIndexReferences(
  mapping: IndexRef,
  config: SingleTableConfig,
): Record<string, string> {
  const allIndexes = Object.entries(mapping).reduce(
    (acc, [index, key]) => ({
      ...acc,

      ...getIndexRecord({
        index,
        ...key,
        config,
      }),
    }),
    {},
  );

  return allIndexes;
}
