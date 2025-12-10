/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  DefinedNameRangeKeyConfig,
  SingleTableQueryParams,
} from 'singleTable/adaptor/definitions';

import type { AnyCollection } from 'singleTable/model';

type BaseParams = Partial<Pick<SingleTableQueryParams<any>, 'retrieveOrder'>>;

type NarrowParams<Registered extends AnyCollection> =
  Registered['narrowBy'] extends 'RANGE_KEY'
    ? Parameters<Registered['originEntity']['getRangeKey']>[0]
    : Registered['narrowBy'] extends (...params: any[]) => DefinedNameRangeKeyConfig
    ? Parameters<Registered['narrowBy']>[0]
    : undefined;

type JoinParams<ParamsA, ParamsB> = ParamsA extends undefined
  ? ParamsB extends undefined
    ? undefined
    : ParamsB
  : ParamsB extends undefined
  ? ParamsA
  : ParamsA & ParamsB;

export type GetCollectionParams<
  Registered extends AnyCollection,
  GetParams = JoinParams<
    Parameters<Registered['getPartitionKey']>[0],
    NarrowParams<Registered>
  >,
> = GetParams extends undefined ? [BaseParams?] : [BaseParams & GetParams];

export type GetCollectionResult<Registered extends AnyCollection> =
  Registered['__type'] extends Array<any>
    ? Registered['__type']
    : Registered['__type'] | undefined;
