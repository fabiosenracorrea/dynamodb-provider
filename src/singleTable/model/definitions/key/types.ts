/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';

import {
  AnyFunction,
  AnyObject,
  FirstParameter,
  IsUndefined,
  IsUnknown,
  PrettifyObject,
} from 'types';

export type KeyGetter<Params extends AnyObject | undefined> = undefined extends Params
  ? () => KeyValue
  : (params: Params) => KeyValue;

type EntityParamsOnly<Entity = undefined> = IsUndefined<Entity> extends true
  ? any
  : { [Key in keyof Entity]: Entity[Key] };

export type EntityKeyResolvers<Entity = undefined> = {
  getPartitionKey: (params: EntityParamsOnly<Entity>) => KeyValue;

  getRangeKey: (params: EntityParamsOnly<Entity>) => KeyValue;
};

type SafeFirstParam<
  Fn extends AnyFunction,
  Params = FirstParameter<Fn>,
> = IsUndefined<Params> extends true ? unknown : Params;

type MergedKeyParams<Resolvers extends EntityKeyResolvers<any>> = SafeFirstParam<
  Resolvers['getPartitionKey']
> &
  SafeFirstParam<Resolvers['getRangeKey']>;

/**
 * Get all the parameters used on partition resolvers
 *
 * Used to merge with other method params
 */
export type EntityKeyParams<Resolvers extends EntityKeyResolvers<any>> = IsUnknown<
  MergedKeyParams<Resolvers>
> extends true
  ? unknown
  : PrettifyObject<
      SafeFirstParam<Resolvers['getPartitionKey']> & SafeFirstParam<Resolvers['getRangeKey']>
    >;

type GetKeyParams<PieceResolvers extends EntityKeyResolvers<any>> = IsUnknown<
  EntityKeyParams<PieceResolvers>
> extends true
  ? []
  : [EntityKeyParams<PieceResolvers>];

export type KeyResolvers<PieceResolvers extends EntityKeyResolvers<any>> = PieceResolvers & {
  getKey: (...params: GetKeyParams<PieceResolvers>) => SingleTableKeyReference;
};
