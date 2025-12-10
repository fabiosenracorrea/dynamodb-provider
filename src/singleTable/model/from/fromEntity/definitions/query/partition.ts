/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyEntity } from 'singleTable/model';
import type { SingleTableQueryParams } from 'singleTable/adaptor/definitions';
import type { QueryResult } from 'provider';
import type { FirstParameter, HasDefined, OptionalTupleIf, SafeObjMerge } from 'types';
import type { OptionalTupleIfUndefined, QueryConfigParams } from './common';

type BaseQueryParams<Registered extends AnyEntity> = SafeObjMerge<
  QueryConfigParams<Registered['__entity']>,
  FirstParameter<Registered['getPartitionKey']>
>;

type CustomQueryParams<Registered extends AnyEntity> =
  BaseQueryParams<Registered> &
    Pick<SingleTableQueryParams<Registered['__entity']>, 'range'>;

type EntityQueryResult<Registered extends AnyEntity> = QueryResult<
  Registered['__entity']
>;

type RangeQueries<Registered extends AnyEntity> = Registered extends {
  rangeQueries: any;
}
  ? {
      [Key in keyof Registered['rangeQueries']]: (
        // basically optional if both params are not required
        ...params: OptionalTupleIf<
          HasDefined<
            [
              FirstParameter<Registered['getPartitionKey']>,
              FirstParameter<Registered['rangeQueries'][Key]>,
            ]
          >,
          false,
          SafeObjMerge<
            //
            BaseQueryParams<Registered>,
            FirstParameter<Registered['rangeQueries'][Key]>
          >
        >
      ) => Promise<EntityQueryResult<Registered>>;
    }
  : unknown;

export type PartitionQueryMethods<Registered extends AnyEntity> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      FirstParameter<Registered['getPartitionKey']>,
      CustomQueryParams<Registered>
    >
  ): Promise<EntityQueryResult<Registered>>;
} & RangeQueries<Registered>;
