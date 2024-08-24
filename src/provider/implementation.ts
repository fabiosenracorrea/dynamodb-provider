/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDB, ScanOutput, GetItemOutput, QueryOutput } from 'aws-sdk';

import { cascadeEval } from 'utils/conditions';
import { waitExponentially } from 'utils/backOff';
import { ensureMaxArraySize } from 'utils/array';
import { getCurrentFormattedTime } from 'utils/date';
import { printLog } from 'utils/log';

import { StringKey, AnyObject } from 'types';

import { removeUndefinedProps } from 'utils/object';
import { IDatabaseProvider, ListAllOptions } from './definition';

import {
  atomicExpressionBuilders,
  expressionBuilders,
  toExpressionName,
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
  maskConditionProp,
  getExpressionNames,
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
  CONDITION_PREFIX,
  buildExpression,
  getFilterParams,
} from './utils';

const NO_RETRIES = 0;
const DYNAMO_BATCH_GET_LIMIT = 90;
const MAX_TRANSACT_ACTIONS = 99;
const MAX_BATCH_GET_RETIRES = 8;

export interface RecursivelyGetItemsParams<Entity>
  extends ListAllOptions<Entity>,
    Pick<DynamoDB.DocumentClient.QueryOutput, 'LastEvaluatedKey'> {
  TableName: string;
  items?: Entity[];
}

// helpers => utils.ts after

export class DatabaseProvider implements IDatabaseProvider {
  private dynamoService: DynamoDB.DocumentClient;

  // add in constructor params like
  // log
  // future: service/v2-v3
  constructor() {
    this.dynamoService = new DynamoDB.DocumentClient();
  }

  private async _scanTable<Entity>(
    params: DynamoDB.DocumentClient.ScanInput,
  ): Promise<ScanOutput<Entity>> {
    printLog(params, 'scanTable');

    return this.dynamoService.scan(params).promise() as unknown as Promise<ScanOutput<Entity>>;
  }

  private async _batchGetItems(
    params: DynamoDB.DocumentClient.BatchGetItemInput,
  ): Promise<DynamoDB.DocumentClient.BatchGetItemOutput> {
    printLog(params, 'batchGetItems');

    return this.dynamoService.batchGet(params).promise();
  }

  private async _getItem<Entity>(
    params: DynamoDB.DocumentClient.GetItemInput,
  ): Promise<GetItemOutput<Entity>> {
    printLog(params, 'getItem');

    return this.dynamoService.get(params).promise() as unknown as Promise<GetItemOutput<Entity>>;
  }

  private async _insertItem(
    params: DynamoDB.DocumentClient.PutItemInput,
  ): Promise<DynamoDB.DocumentClient.PutItemOutput> {
    printLog(params, 'insertItem');

    return this.dynamoService.put(params).promise();
  }

  private async _updateItem(
    params: DynamoDB.DocumentClient.UpdateItemInput,
  ): Promise<DynamoDB.DocumentClient.UpdateItemOutput> {
    printLog(params, 'updateItem');

    return this.dynamoService.update(params).promise();
  }

  private async _deleteItem(
    params: DynamoDB.DocumentClient.DeleteItemInput,
  ): Promise<DynamoDB.DocumentClient.DeleteItemOutput> {
    printLog(params, 'deleteItem');

    return this.dynamoService.delete(params).promise();
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

  private removeUndefinedFields(item: Record<string, any>): Record<string, any> {
    return removeUndefinedProps(item);
  }

  private async recursivelyGetAllItems<Entity extends AnyObject>({
    TableName,
    items = [],
    LastEvaluatedKey,
    propertiesToGet,
    filters = {},
  }: RecursivelyGetItemsParams<Entity>): Promise<Entity[]> {
    const filterParams = getFilterParams<Entity>(filters);

    const params = {
      TableName,

      ProjectionExpression: propertiesToGet?.length
        ? propertiesToGet.map(toExpressionName).join(',')
        : undefined,

      ExclusiveStartKey: LastEvaluatedKey,

      ...filterParams,

      ExpressionAttributeNames:
        filterParams.ExpressionAttributeNames || propertiesToGet?.length
          ? {
              ...filterParams.ExpressionAttributeNames,
              ...getExpressionNames(propertiesToGet || []),
            }
          : undefined,
    };

    const { Items, LastEvaluatedKey: lastKey } = await this._scanTable<Entity>(params);

    const updatedItems = [...items, ...Items];

    if (!lastKey) return updatedItems;

    const allItems = await this.recursivelyGetAllItems({
      TableName,
      items: updatedItems,
      LastEvaluatedKey: lastKey,
      propertiesToGet,
      filters,
    });

    return allItems;
  }

  async listAll<Entity>(
    TableName: string,
    options = {} as ListAllOptions<Entity>,
  ): Promise<Entity[]> {
    const items = await this.recursivelyGetAllItems({
      TableName,
      ...options,
    });

    return items as Entity[];
  }

  async get<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    key,
    table,
    consistentRead,
    propertiesToRetrieve,
  }: GetItemParams<Entity, PKs>): Promise<Entity | undefined> {
    let item: Entity | undefined;

    try {
      const { Item } = await this._getItem<Entity>({
        TableName: table,

        Key: key,

        ConsistentRead: consistentRead,

        ...(propertiesToRetrieve?.length
          ? {
              ProjectionExpression: propertiesToRetrieve.map(toExpressionName).join(','),

              ExpressionAttributeNames: getExpressionNames(propertiesToRetrieve),
            }
          : {}),
      });

      item = Item;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('GET ITEM ERROR', table, key, (err as Error)?.stack);
    }

    return item;
  }

  private _getCreateParams<Entity>({
    item,
    table,
  }: CreateItemParams<Entity>): DynamoDB.DocumentClient.PutItemInput {
    return {
      TableName: table,

      Item: item as DynamoDB.DocumentClient.PutItemInputAttributeMap,
    };
  }

  async create<Entity>(params: CreateItemParams<Entity>): Promise<Entity> {
    const createdAt = getCurrentFormattedTime();

    const created = {
      createdAt,
      ...params.item,
    };

    await this._insertItem(this._getCreateParams(params));

    return created;
  }

  private _getDeleteParams<Entity>({
    key,
    table,
  }: DeleteItemParams<Entity>): DynamoDB.DocumentClient.DeleteItemInput {
    return {
      TableName: table,

      Key: key,
    };
  }

  async delete<Entity extends Record<string, any>>(
    params: DeleteItemParams<Entity>,
  ): Promise<void> {
    await this._deleteItem({
      ...this._getDeleteParams(params),
    });
  }

  private validateUpdateParams({
    key,
    atomicOperations,
    remove,
    values,
    conditions,
  }: UpdateParams<any>): void {
    const actualConditions = conditions || [];

    const propertiesInvolvedInEachOp = [
      Object.keys(values || {}),
      remove || [],
      (atomicOperations || []).map(({ property }) => property),
    ];

    const uniqueProperties = new Set(propertiesInvolvedInEachOp.flat(2));
    const allPropertiesMentioned = propertiesInvolvedInEachOp.reduce(
      (acc, next) => acc + next.length,
      0,
    );

    const malformed = [
      ![1, 2].includes(Object.keys(key).length),
      Object.keys(key).some((prop) => uniqueProperties.has(prop)),
      [values, remove, atomicOperations].every((params) => !params),
      uniqueProperties.size !== allPropertiesMentioned,
      uniqueProperties.size === 0,
      actualConditions.length !== new Set(actualConditions.map(({ property }) => property)).size,
    ].some(Boolean);

    if (malformed) throw new Error('Malformed Update params');
  }

  private getConditionsExpressionValues(
    conditions: UpdateParams<any>['conditions'],
    { mask, masker = maskConditionProp }: { mask?: boolean; masker?: (s: string) => string } = {},
  ): Record<string, any> {
    if (!conditions) return {};

    const toMasked = (prop: string): string => toExpressionValue(mask ? masker(prop) : prop);

    const entries = conditions.reduce((acc, condition) => {
      switch (condition.type) {
        case 'BASIC':
          return [...acc, [toMasked(condition.property), condition.value]];
        case 'EXISTENCE_CHECK':
          return acc;
        case 'LIST_IN':
          return [...acc, [toMasked(condition.property), condition.values]];
        case 'BETWEEN':
          return [
            ...acc,
            [toMasked(`${condition.property}_low`), condition.low],
            [toMasked(`${condition.property}_high`), condition.high],
          ];
        default:
          return acc;
      }
    }, [] as Array<[string, any]>) as Array<[string, any]>;

    return Object.fromEntries(entries);
  }

  private mergeSameOperationExpressions(
    operation: 'SET' | 'REMOVE' | 'ADD' | 'DELETE',
    current: string,
    toAdd: string,
  ): string {
    if (!current) return `${operation} ${toAdd}`;

    // falling into the false here probably means misusage
    const mergeToken = current.startsWith(operation) ? ',' : `${operation},`;

    const expression = `${current}${mergeToken} ${toAdd}`;

    return expression;
  }

  private getValuesUpdateExpression(values: UpdateParams<any>['values']): string {
    return Object.keys(values || {}).reduce((acc, property) => {
      return this.mergeSameOperationExpressions('SET', acc, expressionBuilders.equal(property));
    }, '');
  }

  private addAtomicSetUpdates(
    atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
    currentExpression: string,
  ): string {
    const operationsThatUseSet = atomic.filter(({ type }) =>
      ['sum', 'subtract', 'set_if_not_exists'].includes(type),
    );

    const withSet = operationsThatUseSet.reduce(
      (acc, next) =>
        this.mergeSameOperationExpressions('SET', acc, atomicExpressionBuilders[next.type](next)),
      currentExpression,
    );

    return withSet;
  }

  private addAtomicAddUpdates(
    atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
    currentExpression: string,
  ): string {
    const addOperations = atomic.filter(({ type }) => type === 'add' || type === 'add_to_set');

    if (!addOperations.length) return currentExpression;

    const addExpression = addOperations.reduce(
      (acc, next) =>
        this.mergeSameOperationExpressions('ADD', acc, atomicExpressionBuilders[next.type](next)),
      '' as string, // ts compiler was wrongly complaining,
    );

    return `${currentExpression}${currentExpression.length ? ' ' : ''}${addExpression}`;
  }

  private addAtomicRemoveUpdates(
    atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
    currentExpression: string,
  ): string {
    const addOperations = atomic.filter(({ type }) => type === 'remove_from_set');

    if (!addOperations.length) return currentExpression;

    const addExpression = addOperations.reduce(
      (acc, next) =>
        this.mergeSameOperationExpressions(
          'DELETE',
          acc,
          atomicExpressionBuilders[next.type](next),
        ),
      '' as string, // ts compiler was wrongly complaining,
    );

    return `${currentExpression}${currentExpression.length ? ' ' : ''}${addExpression}`;
  }

  private addAtomicUpdates(
    atomic: UpdateParams<any>['atomicOperations'],
    currentExpression: string,
  ): string {
    if (!atomic?.length) return currentExpression;

    const final = [
      this.addAtomicSetUpdates.bind(this),
      this.addAtomicAddUpdates.bind(this),
      this.addAtomicRemoveUpdates.bind(this),
    ].reduce((acc, resolver) => resolver(atomic, acc), currentExpression);

    return final;
  }

  private addRemovePropertiesUpdates(
    properties: UpdateParams<any>['remove'],
    currentExpression: string,
  ): string {
    if (!properties?.length) return currentExpression;

    const removeExpression = properties.reduce(
      (acc, next) => this.mergeSameOperationExpressions('REMOVE', acc, toExpressionName(next)),
      '' as string, // ts compiler was wrongly complaining,
    );

    return `${currentExpression}${currentExpression.length ? ' ' : ''}${removeExpression}`;
  }

  private buildUpdateExpression({
    atomicOperations,
    remove,
    values,
  }: Pick<UpdateParams<any>, 'atomicOperations' | 'values' | 'remove'>): string {
    // starts with SET
    const valuesExpression = this.getValuesUpdateExpression(values);

    const withAtomic = this.addAtomicUpdates(atomicOperations, valuesExpression);

    return this.addRemovePropertiesUpdates(remove, withAtomic);
  }

  private convertAtomicValue({
    type,
    value,
  }: Pick<Exclude<UpdateParams<any>['atomicOperations'], undefined>[0], 'type' | 'value'>): any {
    switch (type) {
      case 'add_to_set':
      case 'remove_from_set':
        return this.createSet(Array.isArray(value) ? value : [value]);
      default:
        return value;
    }
  }

  private buildAtomicAttributeValues(
    atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
  ): Record<string, any> {
    return buildExpressionAttributeValues(
      Object.fromEntries(
        atomic.map(({ property, value, type }) => [
          property,
          this.convertAtomicValue({ type, value }),
        ]),
      ),
    );
  }

  private _getUpdateParams<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): DynamoDB.DocumentClient.UpdateItemInput {
    this.validateUpdateParams(params);

    const { key, table, remove, returnUpdatedProperties } = params;

    const atomic = params.atomicOperations || [];
    const values = this.removeUndefinedFields(params.values || {});
    const conditions = params.conditions || [];

    return {
      TableName: table,

      Key: key,

      UpdateExpression: this.buildUpdateExpression({
        atomicOperations: atomic,
        remove,
        values,
      }),

      ConditionExpression: conditions.length
        ? buildExpression(conditions, CONDITION_PREFIX)
        : undefined,

      ExpressionAttributeNames: {
        ...buildExpressionAttributeNames(values),

        ...getExpressionNames(remove || []),

        ...getExpressionNames(atomic.map(({ property }) => property)),

        ...getExpressionNames(
          conditions.map(({ property }) => property),
          CONDITION_PREFIX,
        ),
      },

      ExpressionAttributeValues: {
        ...buildExpressionAttributeValues(values),

        ...this.buildAtomicAttributeValues(atomic),

        ...this.getConditionsExpressionValues(conditions, { mask: true }),
      },

      ReturnValues: returnUpdatedProperties ? 'UPDATED_NEW' : undefined,
    };
  }

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    const { Attributes } = await this._updateItem(this._getUpdateParams(params));

    return Attributes as Partial<Entity> | undefined;
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

  private toPaginationToken(dynamoKey: AnyObject): string {
    return Buffer.from(JSON.stringify(dynamoKey), 'utf-8').toString('base64');
  }

  private fromPaginationToken(token: string): AnyObject | undefined {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Db pagination token parse error');
    }
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

      ExclusiveStartKey: paginationToken ? this.fromPaginationToken(paginationToken) : undefined,

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

    const newPaginationToken = LastEvaluatedKey
      ? this.toPaginationToken(LastEvaluatedKey)
      : undefined;

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

          ...(propertiesToRetrieve?.length
            ? {
                ProjectionExpression: propertiesToRetrieve.map(toExpressionName).join(','),

                ExpressionAttributeNames: getExpressionNames(propertiesToRetrieve),
              }
            : {}),
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

      ExpressionAttributeValues: this.getConditionsExpressionValues(conditions),
    };
  }

  private _getTransactParams(
    configs: TransactionConfig[],
  ): DynamoDB.DocumentClient.TransactWriteItemsInput {
    const params = configs.map(({ create, erase, update, validate }) => {
      if (update) return { Update: this._getUpdateParams(update) };

      if (erase) return { Delete: this._getDeleteParams(erase) };

      if (create) return { Put: this._getCreateParams(create) };

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
