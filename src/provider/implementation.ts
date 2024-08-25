/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDB, QueryOutput } from 'aws-sdk';

import { cascadeEval } from 'utils/conditions';
import { waitExponentially } from 'utils/backOff';
import { ensureMaxArraySize } from 'utils/array';
import { printLog } from 'utils/log';

import { StringKey } from 'types';

import { IDatabaseProvider } from './definition';

import {
  expressionBuilders,
  toExpressionValue,
  CollectionListParams,
  CollectionListResult,
  CreateItemParams,
  DeleteItemParams,
  UpdateParams,
  ValidateTransactParams,
  TransactionConfig,
  DBSet,
  BatchListItemsArgs,
  GetItemParams,
  getExpressionNames,
  buildExpression,
  getFilterParams,
  getConditionExpressionValues,
  ItemCreator,
  ItemRemover,
  getProjectExpressionParams,
  ItemGetter,
  ItemUpdater,
  ItemLister,
  ListTableResult,
  ListOptions,
  ListAllOptions,
} from './utils';
import { fromPaginationToken, toPaginationToken } from './utils/pagination';

const NO_RETRIES = 0;
const DYNAMO_BATCH_GET_LIMIT = 90;
const MAX_TRANSACT_ACTIONS = 99;
const MAX_BATCH_GET_RETIRES = 8;

export class DatabaseProvider implements IDatabaseProvider {
  private dynamoService: DynamoDB.DocumentClient;

  private creator: ItemCreator;

  private remover: ItemRemover;

  private getter: ItemGetter;

  private updater: ItemUpdater;

  private lister: ItemLister;

  // add in constructor params like
  // log
  // future: service/v2-v3
  constructor() {
    this.dynamoService = new DynamoDB.DocumentClient();

    this.creator = new ItemCreator({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.remover = new ItemRemover({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.getter = new ItemGetter({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.updater = new ItemUpdater({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.lister = new ItemLister({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });
  }

  private async _batchGetItems(
    params: DynamoDB.DocumentClient.BatchGetItemInput,
  ): Promise<DynamoDB.DocumentClient.BatchGetItemOutput> {
    printLog(params, 'batchGetItems');

    return this.dynamoService.batchGet(params).promise();
  }

  private async _query<Entity = any>(
    params: DynamoDB.DocumentClient.QueryInput,
  ): Promise<QueryOutput<Entity>> {
    printLog(params, 'query');

    return this.dynamoService.query(params).promise() as unknown as Promise<QueryOutput<Entity>>;
  }

  private async _transactionWrite(
    params: DynamoDB.DocumentClient.TransactWriteItemsInput,
  ): Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput> {
    printLog(params, 'transactionWrite');

    return this.dynamoService.transactWrite(params).promise();
  }

  async get<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined> {
    return this.getter.get(params);
  }

  async create<Entity>(params: CreateItemParams<Entity>): Promise<Entity> {
    return this.creator.create(params);
  }

  async delete<Entity extends Record<string, any>>(
    params: DeleteItemParams<Entity>,
  ): Promise<void> {
    await this.remover.delete(params);
  }

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.updater.update(params);
  }

  async list<Entity>(
    table: string,
    options = {} as ListOptions<Entity>,
  ): Promise<ListTableResult<Entity>> {
    return this.lister.list(table, options);
  }

  async listAll<Entity>(table: string, options = {} as ListAllOptions<Entity>): Promise<Entity[]> {
    return this.lister.listAll(table, options);
  }

  private getRangeKeyValueEntries(
    rangeKeyConfig: Exclude<CollectionListParams<any>['rangeKey'], undefined>,
  ): Array<[string, string | number]> {
    switch (rangeKeyConfig.operation) {
      case 'equal':
      case 'lower_than':
      case 'lower_or_equal_than':
      case 'bigger_than':
      case 'bigger_or_equal_than':
      case 'begins_with':
        return [[toExpressionValue(rangeKeyConfig.name), rangeKeyConfig.value]];
      case 'between':
        return [
          [toExpressionValue(`${rangeKeyConfig.name}_low`), rangeKeyConfig.low],
          [toExpressionValue(`${rangeKeyConfig.name}_high`), rangeKeyConfig.high],
        ];
      default:
        throw new Error(`Unknown operation on range key found`);
    }
  }

  private getListCollectionAttributeValues({
    hashKey,
    rangeKey,
  }: Pick<CollectionListParams<any>, 'hashKey' | 'rangeKey'>): Record<string, any> {
    return Object.fromEntries([
      [toExpressionValue(hashKey.name), hashKey.value],

      ...(rangeKey ? this.getRangeKeyValueEntries(rangeKey) : []),
    ]);
  }

  private async recursivelyListCollection<Entity>({
    hashKey,
    table,
    fullRetrieval = true,
    index,
    limit,
    paginationToken,
    rangeKey,
    retrieveOrder = 'ASC',
    items = [],
    filters,
  }: CollectionListParams<Entity> & { items?: Entity[] }): Promise<CollectionListResult<Entity>> {
    const filterValues = getFilterParams(filters);

    const { LastEvaluatedKey, Items } = await this._query({
      TableName: table,

      IndexName: index,

      ScanIndexForward: retrieveOrder === 'ASC',

      Limit: limit ? Math.max(limit - items.length, 1) : undefined,

      ExclusiveStartKey: paginationToken ? fromPaginationToken(paginationToken) : undefined,

      FilterExpression: filterValues?.FilterExpression,

      ExpressionAttributeNames: {
        ...getExpressionNames([hashKey.name, rangeKey?.name].filter(Boolean) as string[]),

        ...filterValues.ExpressionAttributeNames,
      },

      ExpressionAttributeValues: {
        ...this.getListCollectionAttributeValues({
          hashKey,
          rangeKey,
        }),

        ...filterValues.ExpressionAttributeValues,
      },

      KeyConditionExpression: rangeKey
        ? `${expressionBuilders.equal(hashKey.name)} and ${expressionBuilders[rangeKey.operation](
            rangeKey.name,
          )}`
        : expressionBuilders.equal(hashKey.name),
    });

    const updatedItems = [...items, ...(Items || [])];

    const shouldStop = [
      !LastEvaluatedKey,

      cascadeEval([
        { is: !!limit, then: updatedItems.length >= (limit as number) },
        { is: fullRetrieval, then: !LastEvaluatedKey },
      ]),

      !!(!fullRetrieval && !limit),
    ].some(Boolean);

    const newPaginationToken = LastEvaluatedKey ? toPaginationToken(LastEvaluatedKey) : undefined;

    if (shouldStop)
      return {
        items: updatedItems,
        paginationToken: newPaginationToken,
      } as CollectionListResult<Entity>;

    return this.recursivelyListCollection({
      hashKey,
      table,
      fullRetrieval,
      index,
      limit,
      paginationToken: newPaginationToken,
      retrieveOrder,
      rangeKey,
      items: updatedItems,
      filters,
    });
  }

  async listCollection<Entity>(
    params: CollectionListParams<Entity>,
  ): Promise<CollectionListResult<Entity>> {
    return this.recursivelyListCollection(params);
  }

  private async safeBatchGetOperation<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    args: BatchListItemsArgs<Entity, PKs>,
    items: Entity[] = [],
    retries = NO_RETRIES,
  ): Promise<Entity[]> {
    const { keys, table, propertiesToRetrieve, consistentRead = true } = args;

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

    if (!UnprocessedKeys?.[table] || retries > MAX_BATCH_GET_RETIRES) return updatedItems;

    await waitExponentially(retries);

    const newRetryCount = retries + 1;
    const unprocessedItems = UnprocessedKeys[table].Keys as BatchListItemsArgs<Entity, PKs>['keys'];

    return this.safeBatchGetOperation(
      { ...args, keys: unprocessedItems },
      updatedItems,
      newRetryCount,
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
        });

        return batchItems;
      }),
    );

    return items.flat();
  }

  private _getConditionCheckParams({
    conditions,
    key,
    table,
  }: ValidateTransactParams): DynamoDB.DocumentClient.ConditionCheck {
    return {
      TableName: table,

      Key: key,

      ConditionExpression: buildExpression(conditions),

      ExpressionAttributeNames: getExpressionNames(conditions.map(({ property }) => property)),

      ExpressionAttributeValues: getConditionExpressionValues(conditions),
    };
  }

  private _getTransactParams(
    configs: TransactionConfig[],
  ): DynamoDB.DocumentClient.TransactWriteItemsInput {
    const params = configs.map(({ create, erase, update, validate }) => {
      if (update) return { Update: this.updater.getUpdateParams(update) };

      if (erase) return { Delete: this.remover.getDeleteParams(erase) };

      if (create) return { Put: this.creator.getCreateParams(create) };

      if (validate) return { ConditionCheck: this._getConditionCheckParams(validate) };

      throw new Error('Unknown transact type');
    });

    const actualParams = params.filter(Boolean);

    return { TransactItems: actualParams } as DynamoDB.DocumentClient.TransactWriteItemsInput;
  }

  private async executeSingleTransaction(configs: TransactionConfig[]): Promise<void> {
    printLog(configs, 'TRANSACT PARAMS');

    const params = this._getTransactParams(configs);

    printLog(params, 'DYNAMODB LOW LEVEL TRANSACTION PARAMS');

    await this._transactionWrite(params);
  }

  validateTransactions(configs: TransactionConfig[]): void {
    const params = this._getTransactParams(configs);

    const itemKeys = params.TransactItems.map(({ Delete, Put, Update }) => {
      const modifier = Update ?? Delete;

      if (modifier) return `${modifier.Key._pk}--${modifier.Key._sk}`;

      if (Put) return `${Put.Item._pk}--${Put.Item._sk}`;

      throw new Error('Invalid Transaction');
    });

    const uniqueKeys = Array.from(new Set(itemKeys));

    printLog({ uniqueKeys, itemKeys });

    if (uniqueKeys.length !== configs.length)
      throw new Error('MULTIPLE OPERATIONS ON THE SAME ITEM FOUND...');
  }

  async executeTransaction(configs: (TransactionConfig | null)[]): Promise<void> {
    const validConfigs = configs.filter(Boolean) as TransactionConfig[];

    if (!validConfigs.length) return console.log('EMPTY TRANSACTION RESOLVED');

    // for the future: validates already if n > 100 (max supported amount)
    this.validateTransactions(validConfigs);

    if (configs.length < MAX_TRANSACT_ACTIONS)
      throw new Error(`Max supported transaction size is ${MAX_TRANSACT_ACTIONS}`);

    await this.executeSingleTransaction(validConfigs);
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[] {
    return items
      .map((item) => generator(item))
      .flat()
      .filter(Boolean) as TransactionConfig[];
  }

  createSet(items: string[]): DBSet {
    return this.dynamoService.createSet(items) as DBSet;
  }
}
