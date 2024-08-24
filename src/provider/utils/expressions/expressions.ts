/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';
import { ItemExpression } from './types';

import { expressionBuilders } from './builders';

export function buildExpression(conditions: ItemExpression<any>[], prefix = ''): string {
  const expression = conditions.reduce((acc, { operation, property, joinAs = 'and' }) => {
    const isFirst = !acc;

    // containing each expression to its own context
    const nextExpression = `(${expressionBuilders[operation](property, prefix)})`;

    return isFirst ? nextExpression : `${acc} ${joinAs} ${nextExpression}`;
  }, '');

  return expression;
}

export function getExpression<Entity extends AnyObject>(
  config: ItemExpression<Entity>,
): ItemExpression<Entity> {
  return config;
}
