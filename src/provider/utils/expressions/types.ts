/* eslint-disable no-use-before-define */
import { StringKey } from 'types';

export type ExpressionOperation =
  | 'equal'
  | 'not_equal'
  | 'lower_than'
  | 'lower_or_equal_than'
  | 'bigger_than'
  | 'bigger_or_equal_than'
  | 'begins_with'
  | 'contains'
  | 'not_contains'
  | 'between'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists';

interface BasalExpressionValues<Entity> {
  /**
   * The property to perform the expression on
   */
  property: StringKey<Entity>;

  /**
   * How should this expression be joined with the expression before it?
   *
   * This is related to same level expressions, to change `nested`
   * join behavior do it on their expressions
   *
   * *IMPORTANT* - Since its how its joined with the one before it,
   * this is IGNORED for the first expression of the list
   */
  joinAs?: 'and' | 'or';

  /**
   * If you need nested parenthesis and complex expressions,
   * you can create them here. Every nested expression
   * will be joined with the main and encapsulated
   */
  nested?: ItemExpression<Entity>[];
}

export interface BasicExpression<Entity> extends BasalExpressionValues<Entity> {
  value: string | number;

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

export interface EqualityExpression<Entity> extends BasalExpressionValues<Entity> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;

  operation: Extract<ExpressionOperation, 'equal' | 'not_equal'>;
}

export interface BetweenExpression<Entity> extends BasalExpressionValues<Entity> {
  start: string | number;
  end: string | number;

  operation: Extract<ExpressionOperation, 'between'>;
}

export interface ListExpression<Entity> extends BasalExpressionValues<Entity> {
  values: (string | number)[];

  operation: Extract<ExpressionOperation, 'in' | 'not_in'>;
}

export interface AttributeExistenceExpression<Entity> extends BasalExpressionValues<Entity> {
  operation: Extract<ExpressionOperation, 'exists' | 'not_exists'>;
}

export type ItemExpression<Entity> =
  | BasicExpression<Entity>
  | EqualityExpression<Entity>
  | BetweenExpression<Entity>
  | AttributeExistenceExpression<Entity>
  | ListExpression<Entity>;
