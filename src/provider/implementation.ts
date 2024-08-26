/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDB, QueryOutput } from 'aws-sdk';

import { cascadeEval } from 'utils/conditions';
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
  TransactionConfig,
  DBSet,
  BatchListItemsArgs,
  GetItemParams,
  getExpressionNames,
  getFilterParams,
  ItemCreator,
  ItemRemover,
  ItemGetter,
  ItemUpdater,
  ItemLister,
  ListTableResult,
  ListOptions,
  ListAllOptions,
  BatchGetter,
  TransactionWriter,
} from './utils';
import { fromPaginationToken, toPaginationToken } from './utils/pagination';

export class DatabaseProvider implements IDatabaseProvider {
  private dynamoService: DynamoDB.DocumentClient;

  private creator: ItemCreator;

  private remover: ItemRemover;

  private getter: ItemGetter;

  private updater: ItemUpdater;

  private lister: ItemLister;

  private batchGetter: BatchGetter;

  private transactWriter: TransactionWriter;

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

    this.batchGetter = new BatchGetter({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.transactWriter = new TransactionWriter({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });
  }

  private async _query<Entity = any>(
    params: DynamoDB.DocumentClient.QueryInput,
  ): Promise<QueryOutput<Entity>> {
    printLog(params, 'query');

    return this.dynamoService.query(params).promise() as unknown as Promise<QueryOutput<Entity>>;
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

  async batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.batchGetter.batchGet(options);
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

  async executeTransaction(configs: (TransactionConfig | null)[]): Promise<void> {
    await this.transactWriter.executeTransaction(configs);
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[] {
    return this.transactWriter.generateTransactionConfigList(items, generator);
  }

  createSet(items: string[]): DBSet {
    return this.dynamoService.createSet(items) as DBSet;
  }
}
