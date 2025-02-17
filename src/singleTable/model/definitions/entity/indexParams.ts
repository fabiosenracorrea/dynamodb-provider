/* eslint-disable @typescript-eslint/no-explicit-any */

import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';
import { SingleTableConfig } from 'singleTable/adaptor';

import { ensureArray } from 'utils/array';
import { isNonNullable } from 'utils/checkers';

import { omitUndefined } from 'utils/object';
import { IndexMapping, IndexParams, SingleTableConfigWithIndex } from '../indexes';
import { KeyResolvers, resolveKeys } from '../key';
import { getRangeQueriesParams, RangeQueryResultProps } from '../range';

export type GenericIndexMappingFns = {
  getCreationIndexMapping: (params: any) => {
    [K in string]?: Partial<SingleTableKeyReference>;
  };

  getUpdatedIndexMapping: (params: any) => {
    [K in string]?: Partial<SingleTableKeyReference>;
  };
};

type EntityIndexConfig<
  TableConfig extends SingleTableConfigWithIndex,
  IndexConfig extends IndexMapping<TableConfig>,
  TableIndex extends keyof TableConfig['indexes'] = keyof TableConfig['indexes'],
> = {
  /**
   * Create named indexes for your entity
   */
  indexes: {
    [IndexName in keyof IndexConfig]: RangeQueryResultProps<IndexConfig[IndexName]> &
      KeyResolvers<IndexConfig[IndexName]>;
  };

  getCreationIndexMapping: (params: IndexParams<IndexConfig>) => {
    [key in TableIndex]?: Partial<SingleTableKeyReference>;
  };

  getUpdatedIndexMapping: (params: IndexParams<IndexConfig>) => {
    [key in TableIndex]?: Partial<SingleTableKeyReference>;
  };
};

export type ExtendibleIndexProps = GenericIndexMappingFns & {
  indexes: Record<
    string,
    {
      getPartitionKey: (...params: any[]) => KeyValue;
      getRangeKey: (...params: any[]) => KeyValue;
      getKey: (...params: any[]) => SingleTableKeyReference;
      rangeQueries?: any;
    }
  >;
};

export type EntityIndexInputParams<
  TableConfig extends SingleTableConfig,
  Entity,
> = TableConfig extends SingleTableConfigWithIndex
  ? { indexes?: IndexMapping<TableConfig, Entity> }
  : object;

export type EntityIndexResultProps<
  TableConfig extends SingleTableConfig,
  Params,
> = TableConfig extends SingleTableConfigWithIndex
  ? Params extends { indexes?: any }
    ? Params['indexes'] extends IndexMapping<TableConfig>
      ? EntityIndexConfig<TableConfig, Params['indexes']>
      : object
    : object
  : object;

// We repeat the same thing that happens inside the SingleTable adaptor to make sure
function isInvalidKey(key?: KeyValue): boolean {
  if (!key || !key.length) return true;

  const asArray = ensureArray(key);

  return asArray.some((x) => !isNonNullable(x));
}

function validateIndexKeyReturn(key?: KeyValue): KeyValue | undefined {
  return isInvalidKey(key) ? undefined : key!;
}

export function getEntityIndexParams<
  TableConfig extends SingleTableConfig,
  IParams extends EntityIndexInputParams<TableConfig, any>,
>(tableConfig: SingleTableConfig, params: IParams): EntityIndexResultProps<TableConfig, IParams> {
  const okParams = tableConfig.indexes && typeof params === 'object' && 'indexes' in params!;

  if (!okParams) return {} as EntityIndexResultProps<TableConfig, IParams>;

  const { indexes } = params as { indexes: IndexMapping<SingleTableConfigWithIndex, any> };

  return {
    indexes: Object.fromEntries(
      Object.entries(indexes).map(([indexName, indexConfig]) => [
        indexName,
        {
          ...indexConfig,

          ...resolveKeys(indexConfig),

          ...getRangeQueriesParams(indexConfig),
        },
      ]),
    ),

    getCreationIndexMapping: (indexParams: any) =>
      Object.fromEntries(
        Object.values(indexes)
          .map(({ getPartitionKey, getRangeKey, index }) => {
            const partitionKey = validateIndexKeyReturn(getPartitionKey(indexParams));
            const rangeKey = validateIndexKeyReturn(getRangeKey(indexParams));

            if (!partitionKey && !rangeKey) return [];

            return [
              index,

              omitUndefined({
                partitionKey,
                rangeKey,
              }),
            ];
          })
          // prevents Object.fromEntries([ [] ]) => { undefined: undefined }
          .filter(([index]) => index),
      ),

    getUpdatedIndexMapping: (indexParams: any) =>
      Object.fromEntries(
        Object.values(indexes)
          .map(({ getPartitionKey, getRangeKey, index }) => {
            const partitionKey = validateIndexKeyReturn(getPartitionKey(indexParams));
            const rangeKey = validateIndexKeyReturn(getRangeKey(indexParams));

            if (!partitionKey && !rangeKey) return [];

            return [
              index,
              omitUndefined({
                partitionKey,
                rangeKey,
              }),
            ];
          })
          .filter(([index]) => index),
      ),
  } as EntityIndexResultProps<TableConfig, IParams>;
}
