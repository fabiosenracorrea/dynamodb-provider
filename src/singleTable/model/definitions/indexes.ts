/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableConfig } from 'singleTable/adaptor';

import { EntityKeyParams, EntityKeyResolvers } from './key';
import { RangeQueryInputProps } from './range';

export type SingleTableConfigWithIndex = SingleTableConfig & {
  indexes: NonNullable<SingleTableConfig['indexes']>;
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

export type IndexParams<Entity, IndexConfig extends IndexMapping<any, any>> = EntityKeyParams<
  Entity,
  IndexConfig[keyof IndexConfig]
>;
