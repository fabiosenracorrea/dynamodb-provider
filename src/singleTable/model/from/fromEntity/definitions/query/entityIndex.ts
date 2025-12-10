/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AnyObject,
  FirstParameter,
  HasDefined,
  OptionalTupleIf,
  SafeObjMerge,
} from 'types';
import type { QueryResult } from 'provider';

import { SingleTableQueryParams } from 'singleTable/adaptor/definitions';

import type {
  ExtendableSingleTableEntity,
  RangeQueryGetters,
  SingleIndex,
} from 'singleTable/model';
import type { OptionalTupleIfUndefined, QueryConfigParams } from './common';

type IndexPartitionParams<Index extends SingleIndex> = FirstParameter<
  Index['getPartitionKey']
> extends undefined
  ? unknown
  : FirstParameter<Index['getPartitionKey']>;

type BaseQueryParams<
  Index extends SingleIndex,
  Entity = AnyObject,
> = QueryConfigParams<Entity> & IndexPartitionParams<Index>;

type CustomQueryParams<Entity, Index extends SingleIndex> = BaseQueryParams<
  Index,
  Entity
> &
  Pick<SingleTableQueryParams<Entity>, 'range'>;

type RangeQueries<
  Entity,
  Index extends SingleIndex,
> = Index['rangeQueries'] extends RangeQueryGetters<any>
  ? {
      [Key in keyof Index['rangeQueries']]: (
        // basically optional if both params are not required
        ...params: OptionalTupleIf<
          HasDefined<
            [
              FirstParameter<Index['getPartitionKey']>,
              FirstParameter<Index['rangeQueries'][Key]>,
            ]
          >,
          false,
          SafeObjMerge<
            //
            BaseQueryParams<Index, Entity>,
            FirstParameter<Index['rangeQueries'][Key]>
          >
        >
      ) => Promise<QueryResult<Entity>>;
    }
  : unknown;

export type SingleIndexQueryMethods<Entity, Index extends SingleIndex> = {
  custom(
    ...params: OptionalTupleIfUndefined<
      FirstParameter<Index['getPartitionKey']>,
      CustomQueryParams<Entity, Index>
    >
  ): Promise<QueryResult<Entity>>;
} & RangeQueries<Entity, Index>;

export type IndexQueryMethods<Registered extends ExtendableSingleTableEntity> =
  Registered extends {
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
