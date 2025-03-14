/* eslint-disable @typescript-eslint/no-explicit-any */
import { ensureMaxArraySize } from 'utils/array';
import { waitExponentially } from 'utils/backOff';

import { StringKey } from 'types';

import { DynamodbExecutor } from '../dynamoDB';
import { getProjectExpressionParams } from '../projection';
import { EntityPK } from '../crud/types';

const MAX_BATCH_GET_RETIRES = 8;
const DYNAMO_BATCH_GET_LIMIT = 100;

export interface BatchListItemsArgs<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * An array of all the items primary keys
   */
  keys: EntityPK<NoInfer<Entity>, PKs>[];

  /**
   *  If set to `true`, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads.
   *
   * Default is `false`
   */
  consistentRead?: boolean;

  /**
   * Which properties should be retrieved
   *
   * Currently this only supports root-level properties
   *
   * Known limitation: The return-type of this call is currently not
   * affected by the properties referenced here
   */
  propertiesToRetrieve?: StringKey<NoInfer<Entity>>[];

  /**
   * By default, this call will try up to 8 times to resolve any UnprocessedItems result from the
   * batchGet call. If it still received any UnprocessedItems, it will return whatever items it received back
   *
   * If you want to strongly validate that no UnprocessedKeys will be left over, you can set this to true
   * to tell the function to throw instead.
   */
  throwOnUnprocessed?: boolean;

  /**
   * By default we'll try to reprocesses keys 8 times,
   * waiting exponentially between attempts
   *
   * Change this to suit your needs
   */
  maxRetries?: number;
}

// type NormalizedGetRef = Omit<BatchListItemsArgs<any>, 'keys'> & {
//   key: AnyObject;
// };

export class BatchGetter extends DynamodbExecutor {
  private async safeBatchGetOperation<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    args: BatchListItemsArgs<Entity, PKs>,
    items: Entity[] = [],
    retries = 1,
  ): Promise<Entity[]> {
    const {
      keys,
      table,
      propertiesToRetrieve,
      consistentRead,
      throwOnUnprocessed,
      maxRetries = MAX_BATCH_GET_RETIRES,
    } = args;

    const params = {
      RequestItems: {
        [table]: {
          ConsistentRead: consistentRead,

          Keys: keys,

          ...getProjectExpressionParams(propertiesToRetrieve),
        },
      },
    };

    const { UnprocessedKeys, Responses } = await this._batchGetItems(params);

    const returnItems = Responses?.[table] || [];

    const updatedItems = [...items, ...returnItems] as Entity[];

    const maxRetriesReached = retries >= maxRetries;

    if (maxRetriesReached && throwOnUnprocessed) throw new Error(`Unprocessed items timeout`);

    if (!UnprocessedKeys?.[table] || maxRetriesReached) return updatedItems;

    await waitExponentially(retries);

    const unprocessedItems = UnprocessedKeys[table].Keys as BatchListItemsArgs<Entity, PKs>['keys'];

    return this.safeBatchGetOperation(
      { ...args, keys: unprocessedItems },
      updatedItems,
      retries + 1,
    );
  }

  async batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]> {
    const { keys } = options;

    if (!keys.length) return [];

    const withSafeLimit = ensureMaxArraySize(keys, DYNAMO_BATCH_GET_LIMIT);

    const items = await Promise.all(
      withSafeLimit.map(async (batchKeys) => {
        const batchItems = await this.safeBatchGetOperation({
          ...options,
          keys: batchKeys,
        } as any);

        return batchItems;
      }),
    );

    return items.flat() as Entity[];
  }

  // TODO: multiTableBatchGet
  // private normalizeArgs(
  //   options: BatchListItemsArgs<any> | BatchListItemsArgs<any>[],
  // ): NormalizedGetRef[] {
  //   const configs = ensureArray(options);

  //   return configs
  //     .map(({ keys, ...getOptions }) =>
  //       keys.map((key) => ({
  //         ...getOptions,
  //         key,
  //       })),
  //     )
  //     .flat();
  // }
}
