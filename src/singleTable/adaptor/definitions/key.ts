import { StringKey } from 'types';
import { SingleTableConfig } from './config';

type KeyCompositionArray = (string | number | null)[];

const KEY_SEPARATOR = '#';

/**
 * Acceptable values to generate the single table key
 *
 * Use `null` to indicate an invalid construction that should be ignored
 * (useful for index resolutions)
 */
export type KeyValue = null | string | KeyCompositionArray;

export type SingleTableKeyReference = {
  partitionKey: KeyValue;
  rangeKey: KeyValue;
};

function convertKey(key: KeyValue | number, config: SingleTableConfig): string {
  if (Array.isArray(key)) return key.join(config.keySeparator ?? KEY_SEPARATOR);

  return `${key}`;
}

type PK<Entity, PKs extends StringKey<Entity> | unknown = unknown> = PKs extends StringKey<Entity>
  ? { [K in PKs]: Entity[K] }
  : Partial<Entity>;

export function getPrimaryKey<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
  { partitionKey, rangeKey }: SingleTableKeyReference,
  config: SingleTableConfig,
): PK<Entity, PKs> {
  return {
    [`${config.partitionKey}`]: convertKey(partitionKey, config),

    [`${config.rangeKey}`]: convertKey(rangeKey, config),
  } as PK<Entity, PKs>;
}
