/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from '../config';

export type NumericIndex<T extends Record<string, { numeric?: boolean }>> = {
  [IndexName in keyof T]: T[IndexName]['numeric'] extends true ? IndexName : never;
}[keyof T];

export function isValidNumericIndexRef(indexName: string, config: SingleTableConfig) {
  const { numeric } = config.indexes?.[indexName] ?? {};

  return !!numeric;
}
