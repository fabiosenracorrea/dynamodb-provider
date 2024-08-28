/* eslint-disable @typescript-eslint/no-explicit-any */

import { DynamoDB, QueryOutput } from 'aws-sdk';

import { printLog } from 'utils/log';
import { cascadeEval } from 'utils/conditions';

import { ExecutorParams } from '../executor';
import { fromPaginationToken, toPaginationToken } from '../pagination';
import { expressionBuilders, getExpressionNames, toExpressionValue } from '../expressions';
import { getFilterParams } from '../filters';

import { CollectionListParams, CollectionListResult } from './types';

export class QueryBuilder {
  private dynamoDB: ExecutorParams['dynamoDB'];

  private options: Pick<ExecutorParams, 'logCallParams'>;

  constructor({ dynamoDB, ...options }: ExecutorParams) {
    this.dynamoDB = dynamoDB;

    this.options = options;
  }

  private async _query<Entity = any>(
    params: DynamoDB.DocumentClient.QueryInput,
  ): Promise<QueryOutput<Entity>> {
    if (this.options.logCallParams) printLog(params, 'query');

    return this.dynamoDB.query(params).promise() as unknown as Promise<QueryOutput<Entity>>;
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
}
