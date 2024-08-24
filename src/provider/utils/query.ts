import { StringKey } from 'types';
import { ExpressionOperation } from './expressions';
import { Filters } from './filters';

export interface BasicRangeKeyConfig<Entity> {
  name: StringKey<Entity>;
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
  name: StringKey<Entity>;
  low: string | number;
  high: string | number;
  operation: Extract<ExpressionOperation, 'between'>;
}

export type RangeKeyConfig<Entity> = BasicRangeKeyConfig<Entity> | BetweenRangeKeyConfig<Entity>;

export interface CollectionListParams<Entity> {
  table: string;

  index?: string;

  hashKey: {
    name: StringKey<Entity>;
    value: string;
  };

  rangeKey?: RangeKeyConfig<Entity>;

  // config

  retrieveOrder?: 'ASC' | 'DESC';

  paginationToken?: string;

  limit?: number;

  fullRetrieval?: boolean;

  filters?: Filters<Entity>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CollectionListResult<Entity = any> {
  items: Entity[];

  paginationToken: string;
}
