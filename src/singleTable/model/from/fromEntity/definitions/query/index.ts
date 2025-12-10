import type { AnyEntity } from 'singleTable/model';

import type { IndexQueryMethods } from './entityIndex';
import type { PartitionQueryMethods } from './partition';

export type QueryMethods<Registered extends AnyEntity> = {
  query: PartitionQueryMethods<Registered>;
} & IndexQueryMethods<Registered>;

export type { IndexQueryMethods, PartitionQueryMethods };
