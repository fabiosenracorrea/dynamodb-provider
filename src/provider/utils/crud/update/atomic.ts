/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';

import { toExpressionName, toExpressionValue } from '../../expressions';

// uses "SET" or "ADD" keyword
interface AtomicMath<Entity> {
  /**
   * The property to update
   */
  property: StringKey<Entity>;

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
interface SetOperation<Entity> {
  /**
   * The property to update
   */
  property: StringKey<Entity>;

  type: 'add_to_set' | 'remove_from_set';

  value: string | number | string[] | number[];
}

// Uses "SET" keyword
interface UpdateIfNotExistsOperation<Entity> {
  /**
   * The property to update
   */
  property: StringKey<Entity>;

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
