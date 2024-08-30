import environment from 'config/env';
import { AnyObject } from 'types/general';

export type KeyValue = null | string | (string | number | null)[];

export type SingleTableKeyReference = {
  partitionKey: KeyValue;
  rangeKey: KeyValue;
};

export type TableIndex = 'Index1' | 'Index2' | 'Index3' | 'Index4';

const KEY_SEPARATOR = '#';

export const singleTableConfig = {
  table: environment.tables.projects,

  keySeparator: KEY_SEPARATOR,

  hashKey: '_pk',
  rangeKey: '_sk',

  expiresAt: '_expiresOn',
  addedAt: '_timestamp',

  itemTypeProp: '_type',

  typeIndex: 'TypeIndex',
} as const;

export type SingleTableConfig = typeof singleTableConfig;

// our table uses legacy naming...
export const indexNameMapping: Record<TableIndex, string> = {
  Index1: 'IndexOne',
  Index2: 'IndexTwo',
  Index3: 'IndexThree',
  Index4: 'IndexFour',
};

export function getIndexHashName(index: TableIndex): string {
  const indexNumber = index.replace(/\D/g, '');

  return `_indexHash${indexNumber}`;
}

export function getIndexRangeName(index: TableIndex): string {
  const indexNumber = index.replace(/\D/g, '');

  return `_indexRange${indexNumber}`;
}

export function cleanInternalProps<E extends AnyObject>(object: E): E {
  const cleaned = Object.entries(object).filter(
    ([key]) => key === singleTableConfig.itemTypeProp || !key.startsWith('_'),
  );

  return Object.fromEntries(cleaned) as E;
}

export function cleanInternalPropsFromList<E extends AnyObject>(list: E[]): E[] {
  return list.map((item) => cleanInternalProps(item));
}
