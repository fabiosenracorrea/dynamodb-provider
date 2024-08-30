import { QueryResult } from 'providers/database/provider/utils';
import { ExtendableRegisteredEntity } from '../../defined';
import { SingleTableQueryParams } from '../../../definitions';
import { RangeQuery, RangeQueryGetters } from '../../entity';
import { EmptyObject, SafeObjectUnion } from '../../entity/helpers';
import { OptionalTupleIfUndefined, QueryConfigParams } from './common';

type BaseQueryParams<Registered extends ExtendableRegisteredEntity> = QueryConfigParams<
  Registered['__entity']
> &
  SafeObjectUnion<Parameters<Registered['getPartitionKey']>[0]>;

type CustomQueryParams<Registered extends ExtendableRegisteredEntity> =
  BaseQueryParams<Registered> &
    Pick<SingleTableQueryParams<Registered['__entity']>, 'range'>;

type QueryResult<Registered extends ExtendableRegisteredEntity> = QueryResult<
  Registered['__entity']
>;

type RangeQueries<Registered extends ExtendableRegisteredEntity> =
  Registered['rangeQueries'] extends RangeQueryGetters<RangeQuery>
    ? {
        [Key in keyof Registered['rangeQueries']]: (
          ...params: OptionalTupleIfUndefined<
            | Parameters<Registered['getPartitionKey']>[0]
            | Parameters<Registered['rangeQueries'][Key]>[0],
            BaseQueryParams<Registered> &
              SafeObjectUnion<Parameters<Registered['rangeQueries'][Key]>[0]>
          >
        ) => Promise<QueryResult<Registered>>;
      }
    : EmptyObject;

export type PartitionQueryMethods<Registered extends ExtendableRegisteredEntity> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      Parameters<Registered['getPartitionKey']>[0],
      CustomQueryParams<Registered>
    >
  ): Promise<QueryResult<Registered>>;
} & RangeQueries<Registered>;
