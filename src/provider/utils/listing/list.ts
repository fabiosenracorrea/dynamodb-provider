/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { removeUndefinedProps } from 'utils/object';

import { DBScanParams, DynamodbExecutor } from '../dynamoDB';

import { Filters, getFilterParams } from '../filters';
import { getProjectionExpression, getProjectionExpressionNames } from '../projection';
import { fromPaginationToken, toPaginationToken } from '../pagination';

export interface ListOptions<Entity> {
  /**
   * Which properties to return from each entity
   */
  propertiesToGet?: (keyof Entity)[];

  /**
   * Filter for conditions to match for each entity
   *
   * You can use 3 different syntaxes:
   *
   * 1. key:value will filter for equality
   *
   * 2. key:value[] will filter for any of those values
   *
   * 3: key:{<FilterConfig>} will handle more complex cases
   */
  filters?: Filters<Entity>;

  /**
   * Define the max amount of items to retrieve
   *
   * DynamoDB might return fewer items if the maximum amount of MB per request is reached
   *
   * Because of that constraint, you might need to run another request with the paginationToken returned
   */
  limit?: number;

  /**
   * Disabled by default
   */
  consistentRead?: boolean;

  /**
   * If you are willing to Scan with parallel workers
   *
   *  Read more on: [aws doc](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.ParallelScan)
   *
   * Each call may still have a `paginationToken`
   */
  parallelRetrieval?: {
    /**
     * The `Segment`to be scanned. Remember this is `zero-based`, which means the first one = 0
     *
     * If total = 3
     *
     * then index = [0, 1, 2]
     */
    segment: number;

    /**
     * The total amount of parallel scans that will be performed
     *
     * If total = 3
     *
     * then index = [0, 1, 2]
     */
    total: number;
  };

  /**
   * The Local or Global index to be scanned
   */
  index?: string;

  /**
   * A previously returned `paginationToken` to continue a list operation
   */
  paginationToken?: string;
}

export type ListAllOptions<Entity> = Omit<ListOptions<Entity>, 'paginationToken' | 'limit'>;

type GetScanParams<Entity> = ListOptions<Entity> & {
  table: string;
  _internalStartKey?: AnyObject;
};

type RecursivelyGetItemsParams<Entity> = GetScanParams<Entity> & {
  items?: Entity[];
};

export type ListTableResult<Entity> = {
  items: Entity[];
  paginationToken?: string;
};

export class ItemLister extends DynamodbExecutor {
  private getListParams<Entity>({
    table,
    consistentRead,
    filters,
    index,
    limit,
    paginationToken,
    parallelRetrieval,
    propertiesToGet,
    _internalStartKey,
  }: GetScanParams<Entity>): DBScanParams<Entity>['input'] {
    const filterParams = getFilterParams(filters);

    const isPaginated = _internalStartKey || paginationToken;

    return removeUndefinedProps({
      TableName: table,

      ConsistentRead: consistentRead,

      ProjectionExpression: getProjectionExpression(propertiesToGet as string[]),

      ExclusiveStartKey: isPaginated
        ? _internalStartKey || fromPaginationToken(paginationToken!)
        : undefined,

      Segment: parallelRetrieval?.segment,
      TotalSegments: parallelRetrieval?.total,

      Limit: limit,

      IndexName: index,

      ...filterParams,

      ExpressionAttributeNames:
        filterParams.ExpressionAttributeNames || propertiesToGet?.length
          ? {
              ...filterParams.ExpressionAttributeNames,
              ...getProjectionExpressionNames(propertiesToGet as string[]),
            }
          : undefined,
    });
  }

  async list<Entity>(
    table: string,
    options = {} as ListOptions<Entity>,
  ): Promise<ListTableResult<Entity>> {
    const { Items = [], LastEvaluatedKey: lastKey } = await this._scanTable<Entity>(
      this.getListParams({
        ...options,
        table,
      }),
    );

    return removeUndefinedProps({
      items: Items,
      paginationToken: lastKey ? toPaginationToken(lastKey) : undefined,
    });
  }

  private async recursivelyGetAllItems<Entity>({
    items = [],
    ...options
  }: RecursivelyGetItemsParams<Entity>): Promise<Entity[]> {
    const { Items, LastEvaluatedKey: lastKey } = await this._scanTable<Entity>(
      this.getListParams(options as any),
    );

    const updatedItems = [...items, ...Items];

    if (!lastKey) return updatedItems;

    return this.recursivelyGetAllItems({
      ...options,
      items: updatedItems,
      _internalStartKey: lastKey,
    });
  }

  async listAll<Entity>(table: string, options = {} as ListAllOptions<Entity>): Promise<Entity[]> {
    const items = await this.recursivelyGetAllItems({
      table,
      ...options,
    });

    return items as Entity[];
  }
}
