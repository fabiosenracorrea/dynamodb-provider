import { AnyObject, StringKey } from 'types';
import { ExpressionOperation } from './expressions';

export const maskConditionProp = (property: string): string => `__condition_${property}`;

export interface BaseConditions<Entity> {
  property: StringKey<Entity>;
  joinAs?: 'and' | 'or';
  value: string | number;
  type: 'BASIC';
  operation: Extract<
    ExpressionOperation,
    | 'equal'
    | 'not_equal'
    | 'lower_than'
    | 'lower_or_equal_than'
    | 'bigger_than'
    | 'bigger_or_equal_than'
    | 'begins_with'
    | 'contains'
    | 'not_contains'
  >;
}

export interface BetweenOperation<Entity> {
  property: StringKey<Entity>;
  joinAs?: 'and' | 'or';
  low: string | number;
  high: string | number;
  type: 'BETWEEN';
  operation: Extract<ExpressionOperation, 'between'>;
}

export interface InOperation<Entity> {
  property: StringKey<Entity>;
  joinAs?: 'and' | 'or';
  // operation: 'in' | 'not_in'; -> add negation after?
  operation: Extract<ExpressionOperation, 'in'>;
  type: 'LIST_IN';
  values: (string | number)[];
}

export interface AttributeExistenceOperations<Entity> {
  property: StringKey<Entity>;
  joinAs?: 'and' | 'or';
  operation: Extract<ExpressionOperation, 'exists' | 'not_exists'>;
  type: 'EXISTENCE_CHECK';
}

export type SingleConditionExpression<Entity> =
  | BaseConditions<Entity>
  | BetweenOperation<Entity>
  | AttributeExistenceOperations<Entity>
  | InOperation<Entity>;

export function getCondition<Entity = AnyObject>(
  config: SingleConditionExpression<Entity>,
): SingleConditionExpression<Entity> {
  return config;
}
