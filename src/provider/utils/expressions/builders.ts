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

export function getExpressionNames(
  properties: string[],
  { maskName }: { maskName?: (prop: string) => string } = {},
): Record<string, string> {
  return Object.fromEntries(
    properties.map((property) => [toExpressionName(maskName?.(property) ?? property), property]),
  );
}

export function buildExpressionAttributeNames(item: AnyObject): Record<string, string> {
  return getExpressionNames(Object.keys(item));
}

export function buildExpressionAttributeValues(item: AnyObject): AnyObject {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [toExpressionValue(key), value]),
  );
}

type Masker = (p: string) => string;

const withMask = (prop: string, type: 'name' | 'value', mask?: Masker): string => {
  const propRef = mask?.(prop) ?? prop;

  const converter = type === 'name' ? toExpressionName : toExpressionValue;

  return converter(propRef);
};

export const expressionBuilders: Record<
  ExpressionOperation,
  (property: string, mask?: Masker) => string
> = {
  equal: (prop, mask) => `${withMask(prop, 'name', mask)} = ${withMask(prop, 'value', mask)}`,

  not_equal: (prop, mask) => `${withMask(prop, 'name', mask)} <> ${withMask(prop, 'value', mask)}`,

  lower_than: (prop, mask) => `${withMask(prop, 'name', mask)} < ${withMask(prop, 'value', mask)}`,

  lower_or_equal_than: (prop, mask) =>
    `${withMask(prop, 'name', mask)} <= ${withMask(prop, 'value', mask)}`,

  bigger_than: (prop, mask) => `${withMask(prop, 'name', mask)} > ${withMask(prop, 'value', mask)}`,

  bigger_or_equal_than: (prop, mask) =>
    `${withMask(prop, 'name', mask)} >= ${withMask(prop, 'value', mask)}`,

  between: (prop, mask) =>
    `${withMask(prop, 'name', mask)} between ${withMask(
      `${prop}`,
      'value',
      mask,
    )}_low and ${withMask(`${prop}`, 'value', mask)}_high`,

  begins_with: (prop, mask) =>
    `begins_with(${withMask(prop, 'name', mask)}, ${withMask(prop, 'value', mask)})`,

  contains: (prop, mask) =>
    `contains(${withMask(prop, 'name', mask)}, ${withMask(prop, 'value', mask)})`,

  not_contains: (prop, mask) =>
    `not contains(${withMask(prop, 'name', mask)}, ${withMask(prop, 'value', mask)})`,

  exists: (prop, mask) => `attribute_exists(${withMask(prop, 'name', mask)})`,
  not_exists: (prop, mask) => `attribute_not_exists(${withMask(prop, 'name', mask)})`,

  in: (prop, mask) => `${withMask(prop, 'name', mask)} in ${withMask(prop, 'value', mask)}`,
};
