/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';

import { ExpressionOperation } from '../expressions';
import { Filters } from '../filters';

export interface BasicRangeKeyConfig<Entity> {
  name: keyof Entity;
  value: string | number;
  operation: Extract<
    ExpressionOperation,
    | 'equal'
    | 'lower_than'
    | 'lower_or_equal_than'
    | 'bigger_than'
    | 'bigger_or_equal_than'
    | 'begins_with'
  >;
}

export interface BetweenRangeKeyConfig<Entity> {
  name: keyof Entity;
  low: string | number;
  high: string | number;
  operation: Extract<ExpressionOperation, 'between'>;
}

export type RangeKeyConfig<Entity> = BasicRangeKeyConfig<Entity> | BetweenRangeKeyConfig<Entity>;

export interface CollectionListParams<Entity> {
  /**
   * The table to perform the query
   */
  table: string;

  /**
   * Table Index, be it local or global
   */
  index?: string;

  /**
   * The partition key of the item
   *
   * Pass in the column name + value
   */
  hashKey: {
    name: StringKey<Entity>;

    value: string;
  };

  /**
   * Further improve the query operation by adding
   * range key conditions
   *
   * Valid operations:
   *
   * - equal
   * - lower_than
   * - lower_or_equal_than
   * - bigger_than
   * - bigger_or_equal_than
   * - begins_with
   * - between
   */
  rangeKey?: RangeKeyConfig<Entity>;

  /**
   * DynamoDB naturally stores items in ASC order
   */
  retrieveOrder?: 'ASC' | 'DESC';

  /**
   * A previously returned `paginationToken` to continue a query operation
   */
  paginationToken?: string;

  /**
   * The max amount of items this operation should return
   */
  limit?: number;

  /**
   * Instructs the operation to fully retrieve the partition
   *
   * This will continue to execute sequential query operations
   * until all partition items are returned
   */
  fullRetrieval?: boolean;

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
}

export interface CollectionListResult<Entity = any> {
  items: Entity[];

  paginationToken: string;
}
