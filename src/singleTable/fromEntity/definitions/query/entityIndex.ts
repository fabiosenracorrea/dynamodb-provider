/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, IfAny } from 'types';
import { QueryResult } from 'provider';

import { SingleTableQueryParams } from 'singleTable/adaptor/definitions';

import { ExtendableRegisteredEntity, RangeQueryGetters, SingleIndex } from 'singleTable/model';
import { OptionalTupleIfUndefined, QueryConfigParams } from './common';

type IndexPartitionParams<Index extends SingleIndex> = IfAny<
  Parameters<Index['getPartitionKey']>[0] extends undefined
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : Parameters<Index['getPartitionKey']>[0],
  unknown,
  Parameters<Index['getPartitionKey']>[0]
>;

type BaseQueryParams<Index extends SingleIndex, Entity = AnyObject> = QueryConfigParams<Entity> &
  IndexPartitionParams<Index>;

type CustomQueryParams<Entity, Index extends SingleIndex> = BaseQueryParams<Index, Entity> &
  Pick<SingleTableQueryParams<Entity>, 'range'>;

type SafeObjectUnion<PossibleUndefinedObject> = PossibleUndefinedObject extends undefined
  ? unknown
  : PossibleUndefinedObject;

type RangeQueryParams<BaseParams, RangeParams> = BaseParams & SafeObjectUnion<RangeParams>;

type RangeQueries<
  Entity,
  Index extends SingleIndex,
> = Index['rangeQueries'] extends RangeQueryGetters<any>
  ? {
      [Key in keyof Index['rangeQueries']]: (
        ...params: OptionalTupleIfUndefined<
          Parameters<Index['getPartitionKey']>[0] | Parameters<Index['rangeQueries'][Key]>[0],
          RangeQueryParams<
            BaseQueryParams<Index, Entity>,
            SafeObjectUnion<Parameters<Index['rangeQueries'][Key]>[0]>
          >
        >
      ) => Promise<QueryResult<Entity>>;
    }
  : unknown;

export type SingleIndexQueryMethods<Entity, Index extends SingleIndex> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      Parameters<Index['getPartitionKey']>[0],
      CustomQueryParams<Entity, Index>
    >
  ): Promise<QueryResult<Entity>>;
} & RangeQueries<Entity, Index>;

export type IndexQueryMethods<Registered extends ExtendableRegisteredEntity> = Registered extends {
  indexes: any;
}
  ? {
      queryIndex: {
        [Index in keyof Registered['indexes']]: SingleIndexQueryMethods<
          Registered['__entity'],
          Registered['indexes'][Index]
        >;
      };
    }
  : object;
