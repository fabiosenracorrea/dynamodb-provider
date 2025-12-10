import type { AnyEntity } from 'singleTable/model';

import type { IndexQueryMethods } from './entityIndex';
import type { PartitionQueryMethods } from './partition';
import { TEST_IndexQueryMethods, TEST_QueryMethods } from './build';

export type QueryMethods<Registered extends AnyEntity> = {
  query: PartitionQueryMethods<Registered>;
} & IndexQueryMethods<Registered>;

export type __NEWQueryMethods<Registered extends AnyEntity> = {
  __query: TEST_QueryMethods<Registered, Registered['__entity']>;
} & TEST_IndexQueryMethods<Registered>;

export type { IndexQueryMethods, PartitionQueryMethods };
