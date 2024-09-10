/* eslint-disable @typescript-eslint/no-explicit-any */
// import { RangeQuery } from './range';

import { SingleTableParams } from 'singleTable/adaptor';
import { EntityKeyParams, EntityKeyResolvers } from './key';
import { RangeQueryInputProps } from './range';

type SingleTableConfigWithIndex = SingleTableParams & {
  indexes: NonNullable<SingleTableParams['indexes']>;
};

export type SingleIndex<
  TableConfig extends SingleTableConfigWithIndex = SingleTableConfigWithIndex,
  Entity = undefined,
> = EntityKeyResolvers<Entity> &
  RangeQueryInputProps & {
    index: keyof TableConfig['indexes'];
  };

export type IndexMapping<
  TableConfig extends SingleTableConfigWithIndex = SingleTableConfigWithIndex,
  Entity = undefined,
> = Record<string, SingleIndex<TableConfig, Entity>>;

export type IndexParams<IndexConfig extends IndexMapping<any, any>> = EntityKeyParams<
  IndexConfig[keyof IndexConfig]
>;

export type IndexKeys<IndexConfig extends IndexMapping<any, any>> = keyof IndexParams<IndexConfig>;
