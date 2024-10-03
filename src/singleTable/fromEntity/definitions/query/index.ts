import { ExtendableSingleTableEntity } from 'singleTable/model';

import { IndexQueryMethods } from './entityIndex';
import { PartitionQueryMethods } from './partition';

export type QueryMethods<Registered extends ExtendableSingleTableEntity> = {
  query: PartitionQueryMethods<Registered>;
} & IndexQueryMethods<Registered>;

export type { IndexQueryMethods, PartitionQueryMethods };
