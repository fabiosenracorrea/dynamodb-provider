/* eslint-disable @typescript-eslint/no-explicit-any */
// import { RangeQuery } from './range';

import { SingleTableParams } from 'singleTable/adaptor';
import { EntityKeyParams, EntityKeyResolvers } from './key';

type RangeQuery = never;

type SingleTableConfigWithIndex = SingleTableParams & {
  indexes: NonNullable<SingleTableParams['indexes']>;
};

export type SingleIndex<
  TableConfig extends SingleTableConfigWithIndex = SingleTableConfigWithIndex,
  Entity = undefined,
> = EntityKeyResolvers<Entity> & {
  index: keyof TableConfig['indexes'];

  rangeQueries?: RangeQuery;
};

export type IndexMapping<
  TableConfig extends SingleTableConfigWithIndex = SingleTableConfigWithIndex,
  Entity = undefined,
> = Record<string, SingleIndex<TableConfig, Entity>>;

export type IndexParams<IndexConfig extends IndexMapping<any, any>> = EntityKeyParams<
  IndexConfig[keyof IndexConfig]
>;

export type IndexKeys<IndexConfig extends IndexMapping<any, any>> = keyof IndexParams<IndexConfig>;
