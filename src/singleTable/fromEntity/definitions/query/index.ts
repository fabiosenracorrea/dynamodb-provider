import { ExtendableRegisteredEntity } from 'singleTable/model';

import { IndexQueryMethods } from './entityIndex';
import { PartitionQueryMethods } from './partition';

export type QueryMethods<Registered extends ExtendableRegisteredEntity> = {
  query: PartitionQueryMethods<Registered>;
} & IndexQueryMethods<Registered>;

export type { IndexQueryMethods, PartitionQueryMethods };
