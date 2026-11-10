/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { quickSwitch } from 'utils/conditions';
import {
  BasicExpression,
  BetweenExpression,
  ExpressionOperation,
  ItemExpression,
  ListExpression,
} from './types';

// as used on all AWS examples
const EXPRESSION_NAMES_CHAR = '#';
const EXPRESSION_VALUES_CHAR = ':';

export function toExpressionName(property: string): string {
  return `${EXPRESSION_NAMES_CHAR}${property}`;
}

export function toExpressionValue(property: string): string {
  return `${EXPRESSION_VALUES_CHAR}${property}`;
}

export function getExpressionNames(
  properties: string[],
  prefix = '',
): Record<string, string> {
  return Object.fromEntries(
    properties.map((property) => [toExpressionName(`${prefix}${property}`), property]),
  );
}

export function buildExpressionAttributeNames(item: AnyObject): Record<string, string> {
  return getExpressionNames(Object.keys(item));
}

export function buildExpressionAttributeValues(item: AnyObject, prefix = ''): AnyObject {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      toExpressionValue(`${prefix}${key}`),
      value,
    ]),
  );
}

const addPrefix = (prop: string, type: 'name' | 'value', prefix = ''): string => {
  const converter = type === 'name' ? toExpressionName : toExpressionValue;

  return converter(`${prefix}${prop}`);
};

function toListValueName(prop: string, index: number) {
  return `${prop}_${index}`;
}

function toListExp(prop: string, values: any[], prefix?: string) {
  const spread = values.map((_, index) =>
    addPrefix(toListValueName(prop, index), 'value', prefix),
  );

  return `(${spread.join(',')})`;
}

export const expressionBuilders: Record<
  ExpressionOperation,
  (params: { prop: string; value?: any; prefix?: string }) => string
> = {
  equal: ({ prop, prefix }) =>
    `${addPrefix(prop, 'name', prefix)} = ${addPrefix(prop, 'value', prefix)}`,

  not_equal: ({ prop, prefix }) =>
    `${addPrefix(prop, 'name', prefix)} <> ${addPrefix(prop, 'value', prefix)}`,

  lower_than: ({ prop, prefix }) =>
    `${addPrefix(prop, 'name', prefix)} < ${addPrefix(prop, 'value', prefix)}`,

  lower_or_equal_than: ({ prop, prefix }) =>
    `${addPrefix(prop, 'name', prefix)} <= ${addPrefix(prop, 'value', prefix)}`,

  bigger_than: ({ prop, prefix }) =>
    `${addPrefix(prop, 'name', prefix)} > ${addPrefix(prop, 'value', prefix)}`,

  bigger_or_equal_than: ({ prop, prefix }) =>
    `${addPrefix(prop, 'name', prefix)} >= ${addPrefix(prop, 'value', prefix)}`,

  between: ({ prop, prefix }) =>
    [
      addPrefix(prop, 'name', prefix),
      'between',
      `${addPrefix(`${prop}`, 'value', prefix)}_start`,
      'and',
      `${addPrefix(`${prop}`, 'value', prefix)}_end`,
    ].join(' '),

  begins_with: ({ prop, prefix }) =>
    `begins_with(${addPrefix(prop, 'name', prefix)}, ${addPrefix(
      prop,
      'value',
      prefix,
    )})`,

  contains: ({ prop, prefix }) =>
    `contains(${addPrefix(prop, 'name', prefix)}, ${addPrefix(prop, 'value', prefix)})`,

  not_contains: ({ prop, prefix }) =>
    `not contains(${addPrefix(prop, 'name', prefix)}, ${addPrefix(
      prop,
      'value',
      prefix,
    )})`,

  exists: ({ prop, prefix }) => `attribute_exists(${addPrefix(prop, 'name', prefix)})`,
  not_exists: ({ prop, prefix }) =>
    `attribute_not_exists(${addPrefix(prop, 'name', prefix)})`,

  in: ({ prop, prefix, value = [] }) =>
    `${addPrefix(prop, 'name', prefix)} in ${toListExp(prop, value, prefix)}`,

  not_in: ({ prop, prefix, value = [] }) =>
    `not ${addPrefix(prop, 'name', prefix)} in ${toListExp(prop, value, prefix)}`,
};

export function getExpressionValues(
  expressions: ItemExpression<any>[],
  prefix = '',
): AnyObject {
  if (!expressions.length) return {};

  const withPrefix = (prop: string): string => addPrefix(prop, 'value', prefix);

  const entries = expressions.reduce((acc, expression) => {
    return quickSwitch(expression.operation, [
      {
        is: ['exists', 'not_exists'],
        then: acc,
      },
      {
        is: ['in', 'not_in'],
        then: () => [
          ...acc,
          ...(expression as ListExpression<any>).values.map((value, index) => [
            addPrefix(toListValueName(expression.property, index), 'value', prefix),
            value,
          ]),
        ],
      },
      {
        is: [
          'begins_with',
          'bigger_or_equal_than',
          'bigger_than',
          'contains',
          'equal',
          'lower_or_equal_than',
          'lower_than',
          'not_contains',
          'not_equal',
        ],

        then: () => [
          ...acc,
          [withPrefix(expression.property), (expression as BasicExpression<any>).value],
        ],
      },
      {
        is: 'between',
        then: () => [
          ...acc,
          [
            withPrefix(`${expression.property}_start`),
            (expression as BetweenExpression<any>).start,
          ],
          [
            withPrefix(`${expression.property}_end`),
            (expression as BetweenExpression<any>).end,
          ],
        ],
      },
    ]);
  }, [] as Array<[string, any]>) as Array<[string, any]>;

  return Object.fromEntries(entries);
}
