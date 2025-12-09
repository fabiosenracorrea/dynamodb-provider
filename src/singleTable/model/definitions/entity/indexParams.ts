/* eslint-disable @typescript-eslint/no-explicit-any */

import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';
import { SingleTableConfig } from 'singleTable/adaptor';

import { ensureArray } from 'utils/array';
import { isNonNullable } from 'utils/checkers';

import { omitUndefined } from 'utils/object';
import { AnyObject } from 'types';
import { IndexMapping, IndexParams, SingleTableConfigWithIndex } from '../indexes';
import { EntityKeyGetters, resolveKeys } from '../key';
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
  Entity,
  IndexConfig extends IndexMapping<TableConfig>,
  TableIndex extends keyof TableConfig['indexes'] = keyof TableConfig['indexes'],
> = {
  /**
   * Create named indexes for your entity
   */
  indexes: {
    [IndexName in keyof IndexConfig]: RangeQueryResultProps<IndexConfig[IndexName]> &
      EntityKeyGetters<Entity, IndexConfig[IndexName]> & { index: IndexName };
  };

  getCreationIndexMapping: (params: IndexParams<Entity, IndexConfig>) => {
    [key in TableIndex]?: Partial<SingleTableKeyReference>;
  };

  getUpdatedIndexMapping: (params: IndexParams<Entity, IndexConfig>) => {
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
  ? { indexes?: IndexMapping<TableConfig, Entity>; type: string }
  : { type: string };

export type EntityIndexResultProps<
  TableConfig extends SingleTableConfig,
  Entity,
  Params,
> = TableConfig extends SingleTableConfigWithIndex
  ? Params extends { indexes?: any }
    ? Params['indexes'] extends IndexMapping<TableConfig, Entity>
      ? EntityIndexConfig<TableConfig, Entity, Params['indexes']>
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

function validateDoubleReference(
  indexes: IndexMapping<SingleTableConfigWithIndex, any>,
  type: string,
): void {
  const references = Object.values(indexes).map(({ index }) => index);

  const unique = new Set(references);

  if (unique.size !== references.length)
    throw new Error(`Duplicate index reference on entity ${type}`);
}

export function getEntityIndexParams<
  TableConfig extends SingleTableConfig,
  IParams extends EntityIndexInputParams<TableConfig, any>,
>(
  tableConfig: SingleTableConfig,
  params: IParams,
): EntityIndexResultProps<TableConfig, AnyObject, IParams> {
  const okParams = tableConfig.indexes && typeof params === 'object' && 'indexes' in params!;

  if (!okParams) return {} as EntityIndexResultProps<TableConfig, AnyObject, IParams>;

  const { indexes } = params as { indexes: IndexMapping<SingleTableConfigWithIndex, any> };

  validateDoubleReference(indexes, params.type);

  const fixedIndexes = Object.fromEntries(
    Object.entries(indexes).map(([indexName, indexConfig]) => [
      indexName,
      {
        ...indexConfig,

        ...resolveKeys(indexConfig),

        ...getRangeQueriesParams(indexConfig),
      },
    ]),
  );

  return {
    indexes: fixedIndexes,

    getCreationIndexMapping: (indexParams: any) =>
      Object.fromEntries(
        Object.values(fixedIndexes)
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
        Object.values(fixedIndexes)
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
  } as EntityIndexResultProps<TableConfig, AnyObject, IParams>;
}
