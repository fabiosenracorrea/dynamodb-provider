/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';

import { ItemExpression, toExpressionName, toExpressionValue } from '../../expressions';

/**
 * Because ItemExpression is a Union,
 * we force distributivity here with the `T extends T`
 *
 * If we do Omit<Entity, 'xxx'> it doesn't act on each expression
 * individually
 */
type AtomicIf<Entity, T = ItemExpression<Entity>> = T extends T
  ? Omit<T, 'property' | 'joinAs'> & {
      /**
       * The property to perform the expression on
       */
      property?: StringKey<Entity>;
    }
  : never;

interface CommonAtomicProps<Entity> {
  /**
   * The property to update
   */
  property: StringKey<Entity>;

  /**
   * Tightly reference a condition for your operation.
   *
   * If you use this, the `property` defaults to the same
   * you are trying to operate on. You can still provide a different
   * one if necessary
   *
   * With this you can go from:
   *
   * ```ts
   * db.update({
   *   id: '12',
   *
   *   atomicOperations: [
   *     {
   *       type: 'subtract',
   *       property: 'count',
   *       value: 1
   *     }
   *   ],
   *
   *   conditions: [
   *     {
   *       operation: 'bigger_than',
   *       property: 'count',
   *       value: 0,
   *     }
   *   ]
   * })
   * ```
   *
   * to this:
   *
   *```ts
   * db.update({
   *   id: '12',
   *
   *   atomicOperations: [
   *     {
   *       type: 'subtract',
   *       property: 'count',
   *       value: 1,
   *
   *       if: {
   *         operation: 'bigger_than',
   *         value: 0
   *       }
   *     }
   *   ],
   * })
   * ```
   *
   * Both of the above examples are valid. You can choose what makes more sense to you.
   */
  if?: AtomicIf<Entity>;
}

// uses "SET" or "ADD" keyword
interface AtomicMath<Entity> extends CommonAtomicProps<Entity> {
  /**
   * Important differences:
   *
   * - `sum` and `subtract` only work if the **field already exists**
   * - `add` is more resilient, and sets the field to zero before executing the action
   */
  type: 'sum' | 'subtract' | 'add';

  value: number;
}

// uses "ADD" or "DELETE" keyword
interface SetOperation<Entity> extends CommonAtomicProps<Entity> {
  type: 'add_to_set' | 'remove_from_set';

  value: string | number | string[] | number[];
}

// Uses "SET" keyword
export interface UpdateIfNotExistsOperation<Entity> extends CommonAtomicProps<Entity> {
  /**
   * The reference property to check if it does not exist
   *
   * If not provided, the check is performed on the property itself
   */
  refProperty?: StringKey<Entity>;

  /**
   * Sets this property if and only if the not_exists check is true
   */
  type: 'set_if_not_exists';

  value: any;
}

// think for operations with objects (obj.path) and arrays arr[1] = something later
export type AtomicOperation<Entity> =
  | AtomicMath<Entity>
  | SetOperation<Entity>
  | UpdateIfNotExistsOperation<Entity>;

// these are tested within the updateExpression tests
export const atomicExpressionBuilders: Record<
  AtomicOperation<any>['type'],
  (atomic: AtomicOperation<any>) => string
> = {
  sum: ({ property }) =>
    `${toExpressionName(property)} = ${toExpressionName(property)} + ${toExpressionValue(
      property,
    )}`,

  subtract: ({ property }) =>
    `${toExpressionName(property)} = ${toExpressionName(property)} - ${toExpressionValue(
      property,
    )}`,

  set_if_not_exists: ({ property, ...rest }) => {
    const refProp = (rest as UpdateIfNotExistsOperation<any>).refProperty || property;

    return `${toExpressionName(property)} = if_not_exists(${toExpressionName(
      refProp,
    )}, ${toExpressionValue(property)})`;
  },

  // it goes like ADD #prop :prop
  add: ({ property }) => `${toExpressionName(property)} ${toExpressionValue(property)}`,
  add_to_set: ({ property }) => `${toExpressionName(property)} ${toExpressionValue(property)}`,

  // it goes like DELETE #prop :prop
  remove_from_set: ({ property }) => `${toExpressionName(property)} ${toExpressionValue(property)}`,
};
