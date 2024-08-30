import { omit } from 'utils/object';

import { AnyObject } from 'types';

import { SingleTableConfig } from './config';

function resolveCleanUp({
  autoRemoveTableProperties,
  propertyCleanup,
  keepTypeProperty,
  partitionKey,
  rangeKey,
  indexes,
  typeIndex,
  expiresAt,
}: SingleTableConfig): SingleTableConfig['propertyCleanup'] {
  if (!autoRemoveTableProperties && !propertyCleanup) return;

  if (propertyCleanup) return propertyCleanup;

  const propsToRemove = [
    expiresAt,
    typeIndex.rangeKey,
    keepTypeProperty ? null : typeIndex.partitionKey,
    partitionKey,
    rangeKey,
    ...Object.values(indexes ?? {})
      .map((index) => [index.partitionKey, index.rangeKey])
      .flat(),
  ].filter(Boolean) as string[];

  return (item) => omit(item, propsToRemove);
}

export function cleanInternalProps<E extends AnyObject>(obj: E, config: SingleTableConfig): E {
  const cleanUp = resolveCleanUp(config);

  return (cleanUp?.(obj) || obj) as E;
}

export function cleanInternalPropsFromList<E extends AnyObject>(
  list: E[],
  config: SingleTableConfig,
): E[] {
  return list.map((item) => cleanInternalProps(item, config));
}
