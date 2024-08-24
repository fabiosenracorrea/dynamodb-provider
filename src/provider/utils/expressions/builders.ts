import { AnyObject } from 'types';

import { ExpressionOperation } from './types';

// as used on all AWS examples
const EXPRESSION_NAMES_CHAR = '#';
const EXPRESSION_VALUES_CHAR = ':';

export function toExpressionName(property: string): string {
  return `${EXPRESSION_NAMES_CHAR}${property}`;
}

export function toExpressionValue(property: string): string {
  return `${EXPRESSION_VALUES_CHAR}${property}`;
}

export function getExpressionNames(properties: string[], prefix = ''): Record<string, string> {
  return Object.fromEntries(
    properties.map((property) => [toExpressionName(`${prefix}${property}`), property]),
  );
}

export function buildExpressionAttributeNames(item: AnyObject): Record<string, string> {
  return getExpressionNames(Object.keys(item));
}

export function buildExpressionAttributeValues(item: AnyObject, prefix = ''): AnyObject {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [toExpressionValue(`${prefix}${key}`), value]),
  );
}

const addPrefix = (prop: string, type: 'name' | 'value', prefix = ''): string => {
  const converter = type === 'name' ? toExpressionName : toExpressionValue;

  return converter(`${prefix}${prop}`);
};

export const expressionBuilders: Record<
  ExpressionOperation,
  (property: string, prefix?: string) => string
> = {
  equal: (prop, prefix) =>
    `${addPrefix(prop, 'name', prefix)} = ${addPrefix(prop, 'value', prefix)}`,

  not_equal: (prop, prefix) =>
    `${addPrefix(prop, 'name', prefix)} <> ${addPrefix(prop, 'value', prefix)}`,

  lower_than: (prop, prefix) =>
    `${addPrefix(prop, 'name', prefix)} < ${addPrefix(prop, 'value', prefix)}`,

  lower_or_equal_than: (prop, prefix) =>
    `${addPrefix(prop, 'name', prefix)} <= ${addPrefix(prop, 'value', prefix)}`,

  bigger_than: (prop, prefix) =>
    `${addPrefix(prop, 'name', prefix)} > ${addPrefix(prop, 'value', prefix)}`,

  bigger_or_equal_than: (prop, prefix) =>
    `${addPrefix(prop, 'name', prefix)} >= ${addPrefix(prop, 'value', prefix)}`,

  between: (prop, prefix) =>
    [
      addPrefix(prop, 'name', prefix),
      'between',
      `${addPrefix(`${prop}`, 'value', prefix)}_low`,
      'and',
      `${addPrefix(`${prop}`, 'value', prefix)}_high`,
    ].join(' '),

  begins_with: (prop, prefix) =>
    `begins_with(${addPrefix(prop, 'name', prefix)}, ${addPrefix(prop, 'value', prefix)})`,

  contains: (prop, prefix) =>
    `contains(${addPrefix(prop, 'name', prefix)}, ${addPrefix(prop, 'value', prefix)})`,

  not_contains: (prop, prefix) =>
    `not contains(${addPrefix(prop, 'name', prefix)}, ${addPrefix(prop, 'value', prefix)})`,

  exists: (prop, prefix) => `attribute_exists(${addPrefix(prop, 'name', prefix)})`,
  not_exists: (prop, prefix) => `attribute_not_exists(${addPrefix(prop, 'name', prefix)})`,

  in: (prop, prefix) => `${addPrefix(prop, 'name', prefix)} in ${addPrefix(prop, 'value', prefix)}`,
  not_in: (prop, prefix) =>
    `not ${addPrefix(prop, 'name', prefix)} in ${addPrefix(prop, 'value', prefix)}`,
};
