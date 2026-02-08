/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableConfig } from 'singleTable/adaptor';

import { IsUnknown, PrettifyObject, UnionToIntersection } from 'types';
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

type __SingleIndexParams<
  Entity,
  Index extends SingleIndex<any, any>,
  __PARAMS__ = EntityKeyParams<Entity, Index>,
  // necessary as unknown | { something } == unknown
> = IsUnknown<__PARAMS__> extends true ? never : __PARAMS__;

type __IndexParams<
  Entity,
  IndexConfig extends IndexMapping<any, any>,
  //
> = UnionToIntersection<
  {
    [Index in keyof IndexConfig]: __SingleIndexParams<Entity, IndexConfig[Index]>;
  }[keyof IndexConfig]
>;

export type IndexParams<
  Entity,
  IndexConfig extends IndexMapping<any, any>,
> = PrettifyObject<__IndexParams<Entity, IndexConfig>>;
