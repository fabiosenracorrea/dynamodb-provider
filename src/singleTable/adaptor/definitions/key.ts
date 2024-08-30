type KeyCompositionArray = (string | number | null)[];

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
