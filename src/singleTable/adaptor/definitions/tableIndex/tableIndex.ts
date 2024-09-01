import { ensureArray } from 'utils/array';
import { isNonNullable } from 'utils/checkers';
import { removeUndefinedProps } from 'utils/object';

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

function getIndexRecord({
  index,
  partitionKey,
  rangeKey,
  config,
}: IndexGenParams): Record<string, string> {
  const [hashName, rangeName] = [getIndexHashName, getIndexRangeName].map((cb) =>
    cb(index, config),
  );

  const [hashValue, rangeValue] = [partitionKey, rangeKey].map((key) => {
    if (isInvalidKey(key)) return;

    return convertKey(key!, config);
  });

  return removeUndefinedProps({
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
