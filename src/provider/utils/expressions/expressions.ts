/* eslint-disable @typescript-eslint/no-explicit-any */
import { ItemExpression } from './types';

import { expressionBuilders } from './builders';

export function buildExpression(conditions: ItemExpression<any>[], prefix = ''): string {
  const expression = conditions.reduce((acc, { operation, property, joinAs = 'and' }) => {
    const isFirst = !acc;

    const nextExpression = expressionBuilders[operation](property, prefix);

    return isFirst ? nextExpression : `${acc} ${joinAs} ${nextExpression}`;
  }, '');

  return expression;
}
