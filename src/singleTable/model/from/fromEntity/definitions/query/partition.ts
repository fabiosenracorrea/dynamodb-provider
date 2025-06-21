/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtendableSingleTableEntity } from 'singleTable/model';
import type { SingleTableQueryParams } from 'singleTable/adaptor/definitions';
import type { QueryResult } from 'provider';
import type { OptionalTupleIfUndefined, QueryConfigParams } from './common';

type SafeObjectUnion<PossibleUndefinedObject> = PossibleUndefinedObject extends undefined
  ? unknown
  : PossibleUndefinedObject;

type BaseQueryParams<Registered extends ExtendableSingleTableEntity> = QueryConfigParams<
  Registered['__entity']
> &
  SafeObjectUnion<Parameters<Registered['getPartitionKey']>[0]>;

type CustomQueryParams<Registered extends ExtendableSingleTableEntity> =
  BaseQueryParams<Registered> & Pick<SingleTableQueryParams<Registered['__entity']>, 'range'>;

type EntityQueryResult<Registered extends ExtendableSingleTableEntity> = QueryResult<
  Registered['__entity']
>;

type RangeQueries<Registered extends ExtendableSingleTableEntity> = Registered extends {
  rangeQueries: any;
}
  ? {
      [Key in keyof Registered['rangeQueries']]: (
        ...params: OptionalTupleIfUndefined<
          | Parameters<Registered['getPartitionKey']>[0]
          | Parameters<Registered['rangeQueries'][Key]>[0],
          BaseQueryParams<Registered> &
            SafeObjectUnion<Parameters<Registered['rangeQueries'][Key]>[0]>
        >
      ) => Promise<EntityQueryResult<Registered>>;
    }
  : unknown;

export type PartitionQueryMethods<Registered extends ExtendableSingleTableEntity> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      Parameters<Registered['getPartitionKey']>[0],
      CustomQueryParams<Registered>
    >
  ): Promise<EntityQueryResult<Registered>>;
} & RangeQueries<Registered>;
