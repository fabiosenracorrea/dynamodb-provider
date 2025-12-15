/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';
import { omit, pick } from 'utils/object';
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
    const { operation, property, joinAs = 'and', nested = [] } = condition;

    const isFirst = !acc;

    const nextExpression = nested.length
      ? buildExpression(
          [omit(condition, ['nested']) as ItemExpression<any>, ...nested],
          prefix,
        )
      : expressionBuilders[operation]({
          prop: property,
          value: getConditionValue(condition),
          prefix,
        });

    const contained = `(${nextExpression})`;

    return isFirst ? contained : `${acc} ${joinAs} ${contained}`;
  }, '');

  return expression;
}

export function getExpression<Entity extends AnyObject>(
  config: ItemExpression<Entity>,
): ItemExpression<Entity> {
  return config;
}
