/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';

import {
  AnyFunction,
  AnyObject,
  FirstParameter,
  IfUndefined,
  IsUndefined,
  PrettifyObject,
} from 'types';

export type KeyGetter<Params extends AnyObject | undefined> = IfUndefined<
  Params,
  () => KeyValue,
  (params: Params) => KeyValue
>;

type KeyReference = Record<string, string>;

export type FullKeyGetter<PartitionParams, RangeParams> = PartitionParams extends undefined
  ? RangeParams extends undefined
    ? () => KeyReference
    : (params: RangeParams) => KeyReference
  : RangeParams extends undefined
  ? (params: PartitionParams) => KeyReference
  : (params: PartitionParams & RangeParams) => KeyReference;

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

/**
 * Get all the parameters used on partition resolvers
 */
export type EntityKeyParams<Resolvers extends EntityKeyResolvers<any>> = PrettifyObject<
  SafeFirstParam<Resolvers['getPartitionKey']> & SafeFirstParam<Resolvers['getRangeKey']>
>;
