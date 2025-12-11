/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryConfigParams, QueryResult } from 'provider';
import { EnsureQueryAllParams, EnsureQueryOneParams } from 'provider/utils';
import { SingleTableQueryParams } from 'singleTable/adaptor';
import { AnyEntity } from 'singleTable/model/definitions';
import {
  AnyFunction,
  AnyObject,
  EnsureUnionObj,
  FirstParameter,
  HasDefined,
  OptionalTupleIf,
  OptionalTupleIfUndefined,
  SafeObjMerge,
} from 'types';

/**
 * We do NOT need to be more descriptive than this...
 *
 * This will only be used where the conversions here make sense
 */
export type QueryRef = { getPartitionKey: AnyFunction; rangeQueries?: any };

/**
 * Basically:
 *  - range narrowing
 *  - Configs (limit, pagination etc)
 *  - Key params, if present
 */
type QueryParams<ConfigRef extends QueryRef, EntityType> = Pick<
  SingleTableQueryParams<AnyObject>,
  'range'
> &
  QueryConfigParams<EntityType> &
  EnsureUnionObj<FirstParameter<ConfigRef['getPartitionKey']>>;

/**
 * This type looks complex, but its easier to grasp when broken down:
 *
 * - Its, mainly, a **function** definition
 * - This function Will have its param optional if both getPartitionKey and the range()
 * generator from the entity/index do not require any params. otherwise, it **must** receive
 * a param
 *
 * Lastly, it also has 2 methods: `one` and `all`. This ensures we can use them:
 *
 * 1. query.myRange()
 * 2. query.myRange.one()
 *
 * And yes, we do repeat one/all definitions between defaults + ranges,
 * but for clarity its easier to not bring that to yet another abstraction
 */
type RangeCall<
  ConfigRef extends QueryRef,
  EntityType,
  RangeResolver,
  //
  // system params
  //
  __REQUIRE_PARAMS__ = HasDefined<
    [FirstParameter<ConfigRef['getPartitionKey']>, RangeResolver]
  >,
  __PARAMS__ = SafeObjMerge<QueryParams<ConfigRef, EntityType>, RangeResolver>,
> = {
  (
    ...params: OptionalTupleIf<
      // Require params false ? [Params?] : [Params]
      __REQUIRE_PARAMS__,
      false,
      __PARAMS__
    >
  ): Promise<QueryResult<EntityType>>;

  one(
    ...params: OptionalTupleIf<
      __REQUIRE_PARAMS__,
      false,
      EnsureQueryOneParams<__PARAMS__>
    >
  ): Promise<EntityType>;

  all(
    ...params: OptionalTupleIf<
      __REQUIRE_PARAMS__,
      false,
      EnsureQueryAllParams<__PARAMS__>
    >
  ): Promise<EntityType[]>;
};

type RangeMethods<ConfigRef extends QueryRef, EntityType> = ConfigRef extends {
  rangeQueries: any;
}
  ? {
      [RangeQuery in keyof ConfigRef['rangeQueries']]: RangeCall<
        ConfigRef,
        EntityType,
        FirstParameter<ConfigRef['rangeQueries'][RangeQuery]>
      >;
    }
  : unknown;

export type QueryMethods<ConfigRef extends QueryRef, EntityType> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      FirstParameter<ConfigRef['getPartitionKey']>,
      QueryParams<ConfigRef, EntityType>
    >
  ): Promise<QueryResult<EntityType>>;

  one(
    ...params: OptionalTupleIfUndefined<
      FirstParameter<ConfigRef['getPartitionKey']>,
      EnsureQueryOneParams<QueryParams<ConfigRef, EntityType>>
    >
  ): Promise<EntityType>;

  all(
    ...params: OptionalTupleIfUndefined<
      FirstParameter<ConfigRef['getPartitionKey']>,
      EnsureQueryAllParams<QueryParams<ConfigRef, EntityType>>
    >
  ): Promise<EntityType[]>;
} & RangeMethods<ConfigRef, EntityType>;

export type IndexQueryMethods<Registered extends AnyEntity> = Registered extends {
  indexes: any;
}
  ? {
      queryIndex: {
        [Index in keyof Registered['indexes']]: QueryMethods<
          Registered['indexes'][Index],
          Registered['__entity']
        >;
      };
    }
  : object;

export type EntityQueries<Entity extends AnyEntity> = {
  query: QueryMethods<Entity, Entity['__entity']>;
} & IndexQueryMethods<Entity>;
