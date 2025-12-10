/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyObject } from 'types';

import { cascadeEval } from 'utils/conditions';
import { omit } from 'utils/object';

import { DBQueryParams, DynamodbExecutor } from '../dynamoDB';

import { fromPaginationToken, toPaginationToken } from '../pagination';
import {
  buildExpression,
  getExpression,
  getExpressionNames,
  getExpressionValues,
  ItemExpression,
} from '../expressions';
import { getFilterParams } from '../filters';

import { QueryParams, QueryResult, QueryOneParams, QueryAllParams } from './types';
import { getProjectionExpression, getProjectionExpressionNames } from '../projection';

export class QueryBuilder extends DynamodbExecutor {
  private transformKeysToExpressions({
    partitionKey,
    rangeKey,
  }: Pick<QueryParams<any>, 'partitionKey' | 'rangeKey'>): ItemExpression<any>[] {
    const hashKeyExpression = getExpression({
      operation: 'equal',
      property: partitionKey.name,
      value: partitionKey.value,
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
    keys: Pick<QueryParams<any>, 'partitionKey' | 'rangeKey'>,
  ): Pick<
    DBQueryParams<any>['input'],
    'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
  > {
    const keyExpressions = this.transformKeysToExpressions(keys);

    return {
      KeyConditionExpression: buildExpression(keyExpressions),

      ExpressionAttributeNames: getExpressionNames(
        [keys.partitionKey.name, keys.rangeKey?.name].filter(Boolean) as string[],
      ),

      ExpressionAttributeValues: getExpressionValues(keyExpressions),
    };
  }

  private getExpressionParams({
    partitionKey,
    filters,
    rangeKey,
    propertiesToRetrieve,
  }: Pick<
    QueryParams<any>,
    'filters' | 'partitionKey' | 'rangeKey' | 'propertiesToRetrieve'
  >): Pick<
    DBQueryParams<any>['input'],
    | 'KeyConditionExpression'
    | 'ExpressionAttributeNames'
    | 'ExpressionAttributeValues'
    | 'FilterExpression'
    | 'ProjectionExpression'
  > {
    const filterValues = getFilterParams(filters);
    const expressionValues = this.getKeyParams({ partitionKey, rangeKey });

    return {
      FilterExpression: filterValues?.FilterExpression,

      KeyConditionExpression: expressionValues.KeyConditionExpression,

      ProjectionExpression: getProjectionExpression(propertiesToRetrieve as string[]),

      ExpressionAttributeNames: {
        ...expressionValues.ExpressionAttributeNames,
        ...filterValues.ExpressionAttributeNames,
        ...getProjectionExpressionNames(propertiesToRetrieve as string[]),
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
  }: QueryParams<Entity> & { items?: Entity[]; _lastKey?: AnyObject }): Promise<
    QueryResult<Entity>
  > {
    const isPaginated = _lastKey || paginationToken;

    const { LastEvaluatedKey, Items } = await this._query<Entity>({
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
        paginationToken: LastEvaluatedKey
          ? toPaginationToken(LastEvaluatedKey)
          : undefined,
      } as QueryResult<Entity>;

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

  async query<Entity>(params: QueryParams<Entity>): Promise<QueryResult<Entity>> {
    return this.recursivelyListCollection(params);
  }

  /**
   * Queries for the first item matching the criteria
   *
   * @param params - Query parameters (without limit, paginationToken, or fullRetrieval)
   * @returns The first matching item or undefined if no items found
   */
  async queryOne<Entity>(params: QueryOneParams<Entity>): Promise<Entity | undefined> {
    const {
      items: [item],
    } = await this.recursivelyListCollection({
      ...params,
      limit: 1,
      fullRetrieval: false,
    });

    return item;
  }

  /**
   * Queries for all items matching the criteria
   *
   * @param params - Query parameters (without paginationToken or fullRetrieval)
   * @returns Array of all matching items
   */
  async queryAll<Entity>(params: QueryAllParams<Entity>): Promise<Entity[]> {
    const { items } = await this.recursivelyListCollection({
      ...params,
      fullRetrieval: true,
    });

    return items;
  }
}
