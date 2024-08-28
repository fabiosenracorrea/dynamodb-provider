/* eslint-disable @typescript-eslint/no-explicit-any */

import { DynamoDB, QueryOutput } from 'aws-sdk';

import { printLog } from 'utils/log';
import { cascadeEval } from 'utils/conditions';
import { omit } from 'utils/object';

import { ExecutorParams } from '../executor';
import { fromPaginationToken, toPaginationToken } from '../pagination';
import {
  buildExpression,
  getExpression,
  getExpressionNames,
  getExpressionValues,
  ItemExpression,
} from '../expressions';
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

  private transformKeysToExpressions({
    hashKey,
    rangeKey,
  }: Pick<CollectionListParams<any>, 'hashKey' | 'rangeKey'>): ItemExpression<any>[] {
    const hashKeyExpression = getExpression({
      operation: 'equal',
      property: hashKey.name,
      value: hashKey.value,
    });

    if (!rangeKey) return [hashKeyExpression];

    return [
      hashKeyExpression,

      getExpression({
        property: rangeKey.name as string,
        ...omit(rangeKey, ['name']),
      } as ItemExpression<any>),
    ];
  }

  private getQueryAttributes(
    keys: Pick<CollectionListParams<any>, 'hashKey' | 'rangeKey'>,
  ): Pick<
    DynamoDB.DocumentClient.QueryInput,
    'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
  > {
    const keyExpressions = this.transformKeysToExpressions(keys);

    return {
      KeyConditionExpression: buildExpression(keyExpressions),

      ExpressionAttributeNames: getExpressionNames(
        [keys.hashKey.name, keys.rangeKey?.name].filter(Boolean) as string[],
      ),

      ExpressionAttributeValues: getExpressionValues(keyExpressions),
    };
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
    const expressionValues = this.getQueryAttributes({ hashKey, rangeKey });

    const { LastEvaluatedKey, Items } = await this._query({
      TableName: table,

      IndexName: index,

      ScanIndexForward: retrieveOrder === 'ASC',

      Limit: limit ? Math.max(limit - items.length, 1) : undefined,

      ExclusiveStartKey: paginationToken ? fromPaginationToken(paginationToken) : undefined,

      FilterExpression: filterValues?.FilterExpression,

      ExpressionAttributeNames: {
        ...expressionValues.ExpressionAttributeNames,

        ...filterValues.ExpressionAttributeNames,
      },

      ExpressionAttributeValues: {
        ...expressionValues.ExpressionAttributeValues,
        ...filterValues.ExpressionAttributeValues,
      },

      KeyConditionExpression: expressionValues.KeyConditionExpression,
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
