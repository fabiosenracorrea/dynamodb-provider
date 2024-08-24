/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';

import { toExpressionName, toExpressionValue } from './expressions';

interface AtomicMath<Entity> {
  // uses "SET" or "ADD" keyword
  property: StringKey<Entity>;
  type: 'sum' | 'subtract' | 'add';
  value: number;
}

interface SetOperation<Entity> {
  property: StringKey<Entity>;
  // uses "ADD" or "DELETE" keyword
  type: 'add_to_set' | 'remove_from_set';
  value: string | number | string[] | number[];
}

interface UpdateIfNotExistsOperation<Entity> {
  // Uses "SET" keyword
  property: StringKey<Entity>;

  // we can use this to only set it if this ref prop does not exist
  refProperty?: StringKey<Entity>;

  type: 'set_if_not_exists';
  value: any;
}

// think for operations with objects (obj.path) and arrays arr[1] = something later
export type AtomicOperation<Entity> =
  | AtomicMath<Entity>
  | SetOperation<Entity>
  | UpdateIfNotExistsOperation<Entity>;

// export const toAtomicName = (property: string): string => toExpressionName(`atomic_${property}`);
// export const toAtomicValue = (property: string): string => toExpressionValue(`atomic_${property}`);

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
