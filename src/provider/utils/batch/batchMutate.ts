/* eslint-disable @typescript-eslint/no-explicit-any */
import { ensureMaxArraySize, toTruthyList } from 'utils/array';
import { waitExponentially } from 'utils/backOff';

import { StringKey } from 'types';

import { omitUndefined } from 'utils/object';

import { DBBatchWriteParams, DynamodbExecutor } from '../dynamoDB';
import { EntityPK } from '../crud/types';

const MAX_RETIRES = 8;
const DYNAMO_BATCH_WRITE_LIMIT = 25;

export interface BatchMutateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * All items you want to delete
   */
  deletes?: EntityPK<NoInfer<Entity>, PKs>[];

  creations?: Entity[];

  /**
   * By default, this call will try up to 8 times to resolve any UnprocessedItems result from the
   * batchWrite call. If it still received any UnprocessedItems, it will return whatever items it received back
   *
   * If you want to strongly validate that no UnprocessedItems will be left over, you can set this to true
   * to tell the function to throw instead.
   */
  throwOnUnprocessed?: boolean;

  /**
   * By default we'll try to reprocesses 8 times,
   * waiting exponentially between attempts
   *
   * Change this to suit your needs
   */
  maxRetries?: number;
}

export type BatchMutateResult<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = {
  unprocessed?: Partial<Pick<BatchMutateParams<Entity, PKs>, 'deletes' | 'creations'>>;
};

export class BatchMutator extends DynamodbExecutor {
  private toResult({
    creations,
    deletes,
  }: Partial<Pick<BatchMutateParams<unknown>, 'deletes' | 'creations'>>) {
    const hasUnprocessed = creations?.length || deletes?.length;

    return omitUndefined({
      unprocessed: hasUnprocessed
        ? {
            creations: creations?.length ? creations : undefined,
            deletes: deletes?.length ? deletes : undefined,
          }
        : undefined,
    });
  }

  private async safeBatchWriteOperation<
    Entity,
    PKs extends StringKey<Entity> | unknown = unknown,
  >(
    args: BatchMutateParams<Entity, PKs>,
    retries = 1,
  ): Promise<BatchMutateResult<Entity, PKs>> {
    const {
      table,
      throwOnUnprocessed,
      maxRetries = MAX_RETIRES,
      deletes = [],
      creations = [],
    } = args;

    const params = {
      RequestItems: {
        [table]: [
          ...deletes.map((Key) => ({ DeleteRequest: { Key } })),
          ...creations.map((Item) => ({ PutRequest: { Item } })),
        ],
      },
    } as DBBatchWriteParams['input'];

    const { UnprocessedItems = {} } = await this._batchWriteItems(params);

    const unprocessed = UnprocessedItems?.[table] || [];

    const unprocessedDeletes = toTruthyList(
      unprocessed.map(({ DeleteRequest }) => DeleteRequest?.Key),
    ) as NonNullable<BatchMutateParams<Entity, PKs>['deletes']>;

    const unprocessedCreations = toTruthyList(
      unprocessed.map(({ PutRequest }) => PutRequest?.Item),
    ) as NonNullable<BatchMutateParams<Entity, PKs>['creations']>;

    const hasUnprocessed = unprocessedCreations.length || unprocessedDeletes.length;

    const maxRetriesReached = retries >= maxRetries;

    if (maxRetriesReached && throwOnUnprocessed && hasUnprocessed)
      throw new Error(`Unprocessed mutations after max retries`);

    if (!hasUnprocessed || maxRetriesReached)
      return this.toResult({
        creations: unprocessedCreations,
        deletes: unprocessedDeletes,
      }) as BatchMutateResult<Entity, PKs>;

    await waitExponentially(retries);

    return this.safeBatchWriteOperation(
      {
        ...args,
        creations: unprocessedCreations,
        deletes: unprocessedDeletes,
      } as typeof args,
      retries + 1,
    );
  }

  async batchMutate<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchMutateParams<Entity, PKs>,
  ): Promise<BatchMutateResult<Entity, PKs>> {
    const { deletes = [], creations = [] } = options;

    const operations = [
      ...creations.map((create) => ({ create, remove: null })),
      ...deletes.map((remove) => ({ remove, create: null })),
    ];

    if (!operations.length) return {};

    const withSafeLimit = ensureMaxArraySize(operations, DYNAMO_BATCH_WRITE_LIMIT);

    const items = await Promise.all(
      withSafeLimit.map(async (batchKeys) => {
        const batchItems = await this.safeBatchWriteOperation<Entity, PKs>({
          ...options,
          deletes: batchKeys.flatMap((e) => e.remove ?? []),
          creations: batchKeys.flatMap((e) => e.create ?? []),
        } as any);

        return batchItems;
      }),
    );

    const unprocessedCreations = toTruthyList(
      items.map(({ unprocessed }) => unprocessed?.creations ?? []),
    ).flat();

    const unprocessedDeletes = toTruthyList(
      items.map(({ unprocessed }) => unprocessed?.deletes ?? []),
    ).flat();

    return this.toResult({
      creations: unprocessedCreations,
      deletes: unprocessedDeletes,
    }) as BatchMutateResult<Entity, PKs>;
  }
}
