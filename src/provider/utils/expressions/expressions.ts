/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';
import { pick } from 'utils/object';
import { ItemExpression } from './types';

import { expressionBuilders } from './builders';

function getConditionValue(condition: ItemExpression<any>) {
  switch (condition.operation) {
    case 'in':
    case 'not_in':
      return condition.values;
    case 'between':
      return pick(condition, ['start', 'end']);
    case 'exists':
    case 'not_exists':
      return null;
    default:
      return condition.value;
  }
}

export function buildExpression(conditions: ItemExpression<any>[], prefix = ''): string {
  const expression = conditions.reduce((acc, condition) => {
    const { operation, property, joinAs = 'and' } = condition;

    const isFirst = !acc;

    // containing each expression to its own context
    const nextExpression = `(${expressionBuilders[operation]({
      prop: property,
      value: getConditionValue(condition),
      prefix,
    })})`;

    return isFirst ? nextExpression : `${acc} ${joinAs} ${nextExpression}`;
  }, '');

  return expression;
}

export function getExpression<Entity extends AnyObject>(
  config: ItemExpression<Entity>,
): ItemExpression<Entity> {
  return config;
}
