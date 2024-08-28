/* eslint-disable @typescript-eslint/no-explicit-any */

import { DynamoDB, QueryOutput } from 'aws-sdk';

import { AnyObject } from 'types';

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

  private getKeyParams(
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

  private getExpressionParams({
    hashKey,
    filters,
    rangeKey,
  }: Pick<CollectionListParams<any>, 'filters' | 'hashKey' | 'rangeKey'>): Pick<
    DynamoDB.DocumentClient.QueryInput,
    | 'KeyConditionExpression'
    | 'ExpressionAttributeNames'
    | 'ExpressionAttributeValues'
    | 'FilterExpression'
  > {
    const filterValues = getFilterParams(filters);
    const expressionValues = this.getKeyParams({ hashKey, rangeKey });

    return {
      FilterExpression: filterValues?.FilterExpression,

      KeyConditionExpression: expressionValues.KeyConditionExpression,

      ExpressionAttributeNames: {
        ...expressionValues.ExpressionAttributeNames,

        ...filterValues.ExpressionAttributeNames,
      },

      ExpressionAttributeValues: {
        ...expressionValues.ExpressionAttributeValues,
        ...filterValues.ExpressionAttributeValues,
      },
    };
  }

  private async recursivelyListCollection<Entity>({
    table,
    fullRetrieval = true,
    index,
    limit,
    paginationToken,
    retrieveOrder = 'ASC',
    items = [],
    _lastKey,
    ...expressionParams
  }: CollectionListParams<Entity> & { items?: Entity[]; _lastKey?: AnyObject }): Promise<
    CollectionListResult<Entity>
  > {
    const isPaginated = _lastKey || paginationToken;

    const { LastEvaluatedKey, Items } = await this._query({
      TableName: table,

      IndexName: index,

      ScanIndexForward: retrieveOrder === 'ASC',

      Limit: limit ? Math.max(limit - items.length, 1) : undefined,

      ExclusiveStartKey: isPaginated
        ? _lastKey || fromPaginationToken(paginationToken!)
        : undefined,

      ...this.getExpressionParams(expressionParams),
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

    if (shouldStop)
      return {
        items: updatedItems,
        paginationToken: LastEvaluatedKey ? toPaginationToken(LastEvaluatedKey) : undefined,
      } as CollectionListResult<Entity>;

    return this.recursivelyListCollection({
      ...expressionParams,
      table,
      fullRetrieval,
      index,
      limit,
      retrieveOrder,
      items: updatedItems,
      _lastKey: LastEvaluatedKey,
    });
  }

  async query<Entity>(params: CollectionListParams<Entity>): Promise<CollectionListResult<Entity>> {
    return this.recursivelyListCollection(params);
  }
}
