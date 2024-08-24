import { CollectionListResult } from 'providers/database/provider/utils';
import { AnyObject, IfAny } from 'types/general';
import { ExtendableRegisteredEntity, ExtendableWithIndexRegisteredEntity } from '../../defined';
import { SingleTableCollectionListParams } from '../../../definitions';
import { RangeQuery, RangeQueryGetters } from '../../entity';
import { EmptyObject, SafeObjectUnion } from '../../entity/helpers';
import { OptionalTupleIfUndefined, QueryConfigParams } from './common';

type RegisteredIndex =
  ExtendableWithIndexRegisteredEntity['indexes'][keyof ExtendableWithIndexRegisteredEntity['indexes']];

type IndexPartitionParams<Index extends RegisteredIndex> = IfAny<
  Parameters<Index['getPartitionKey']>[0] extends undefined
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : Parameters<Index['getPartitionKey']>[0],
  EmptyObject,
  Parameters<Index['getPartitionKey']>[0]
>;

type BaseQueryParams<
  Index extends RegisteredIndex,
  Entity = AnyObject,
> = QueryConfigParams<Entity> & IndexPartitionParams<Index>;

type CustomQueryParams<Entity, Index extends RegisteredIndex> = BaseQueryParams<Index, Entity> &
  Pick<SingleTableCollectionListParams<Entity>, 'range'>;

type QueryResult<Entity> = CollectionListResult<Entity>;

type RangeQueryParams<BaseParams, RangeParams> = BaseParams & SafeObjectUnion<RangeParams>;

type RangeQueries<
  Entity,
  Index extends RegisteredIndex,
> = Index['rangeQueries'] extends RangeQueryGetters<RangeQuery>
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
  : EmptyObject;

export type SingleIndexQueryMethods<Entity, Index extends RegisteredIndex> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      Parameters<Index['getPartitionKey']>[0],
      CustomQueryParams<Entity, Index>
    >
  ): Promise<QueryResult<Entity>>;
} & RangeQueries<Entity, Index>;

export type IndexQueryMethods<Registered extends ExtendableRegisteredEntity> =
  Registered extends ExtendableWithIndexRegisteredEntity
    ? {
        queryIndex: {
          [Index in keyof Registered['indexes']]: SingleIndexQueryMethods<
            Registered['__entity'],
            Registered['indexes'][Index]
          >;
        };
      }
    : EmptyObject;
