/* eslint-disable @typescript-eslint/no-explicit-any */
import { DefinedNameRangeKeyConfig, SingleTableCollectionListParams } from '../../definitions';
import { ExtendablePartitionCollection } from '../partitionCollection';

type BaseParams = Pick<SingleTableCollectionListParams<any>, 'retrieveOrder'>;

type NarrowParams<Registered extends ExtendablePartitionCollection> =
  Registered['narrow'] extends 'RANGE_KEY'
    ? Parameters<Registered['originEntity']['getRangeKey']>[0]
    : Registered['narrow'] extends (...params: any[]) => DefinedNameRangeKeyConfig
    ? Parameters<Registered['narrow']>[0]
    : undefined;

type JoinParams<ParamsA, ParamsB> = ParamsA extends undefined
  ? ParamsB extends undefined
    ? undefined
    : ParamsB
  : ParamsB extends undefined
  ? ParamsA
  : ParamsA & ParamsB;

export type GetCollectionParams<
  Registered extends ExtendablePartitionCollection,
  GetParams = JoinParams<Parameters<Registered['getPartitionKey']>[0], NarrowParams<Registered>>,
> = GetParams extends undefined ? [BaseParams?] : [BaseParams & GetParams];

export type GetCollectionResult<Registered extends ExtendablePartitionCollection> =
  Registered['__type'] extends Array<any> ? Registered['__type'] : Registered['__type'] | undefined;
