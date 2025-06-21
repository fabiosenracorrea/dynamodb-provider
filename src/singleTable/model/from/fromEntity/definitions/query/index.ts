import type { ExtendableSingleTableEntity } from 'singleTable/model';

import type { IndexQueryMethods } from './entityIndex';
import type { PartitionQueryMethods } from './partition';

export type QueryMethods<Registered extends ExtendableSingleTableEntity> = {
  query: PartitionQueryMethods<Registered>;
} & IndexQueryMethods<Registered>;

export type { IndexQueryMethods, PartitionQueryMethods };
