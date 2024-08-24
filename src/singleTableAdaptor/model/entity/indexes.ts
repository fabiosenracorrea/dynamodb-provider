/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types/general';
import { KeyValue, TableIndex } from '../../config';
import { RangeQuery } from './range';

type EntityParamsOnly<Entity = undefined> = Entity extends undefined
  ? any
  : { [Key in keyof Entity]: Entity[Key] };

export type SingleIndex<Entity = undefined> = {
  index: TableIndex;

  getRangeKey: (params: EntityParamsOnly<Entity>) => KeyValue;
  getPartitionKey: (params: EntityParamsOnly<Entity>) => KeyValue;

  rangeQueries?: RangeQuery;
};

export type IndexMapping<Entity = undefined> = Record<string, SingleIndex<Entity>>;

export type ParamObject<FnParams> = FnParams extends AnyObject ? FnParams : object;

export type ParamKeys<FnParams> = FnParams extends AnyObject ? keyof FnParams : 'no_key';

export type IndexParams<IndexConfig extends IndexMapping> = ParamObject<
  Parameters<IndexConfig[keyof IndexConfig]['getPartitionKey']>[0]
> &
  ParamObject<Parameters<IndexConfig[keyof IndexConfig]['getRangeKey']>[0]>;

type IndexParamKeysMapping<IndexConfig extends IndexMapping> = {
  [Key in keyof IndexConfig]:
    | Exclude<ParamKeys<Parameters<IndexConfig[Key]['getPartitionKey']>[0]>, 'no_key'>
    | Exclude<ParamKeys<Parameters<IndexConfig[Key]['getRangeKey']>[0]>, 'no_key'>;
};

// simply doing keyof IndexParams was not working due to intersection x union interactions
export type IndexKeys<IndexConfig extends IndexMapping> =
  IndexParamKeysMapping<IndexConfig>[keyof IndexParamKeysMapping<IndexConfig>];
