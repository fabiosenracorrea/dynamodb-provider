/* eslint-disable @typescript-eslint/no-explicit-any */
import { expressionBuilders, toExpressionName } from '../../expressions';

import { UpdateParams } from './types';
import { atomicExpressionBuilders } from './atomic';

type DynamoDBUpdateOperation = 'SET' | 'REMOVE' | 'ADD' | 'DELETE';

function mergeSameOperationExpressions(
  operation: DynamoDBUpdateOperation,
  current: string,
  toAdd: string,
): string {
  if (!current) return `${operation} ${toAdd}`;

  // falling into the false here probably means misusage
  const mergeToken = current.startsWith(operation) ? ',' : `${operation},`;

  const expression = `${current}${mergeToken} ${toAdd}`;

  return expression;
}

function getValuesUpdateExpression(values: UpdateParams<any>['values']): string {
  return Object.keys(values || {}).reduce((acc, prop) => {
    return mergeSameOperationExpressions('SET', acc, expressionBuilders.equal({ prop }));
  }, '');
}

function addAtomicSetUpdates(
  atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
  currentExpression: string,
): string {
  const operationsThatUseSet = atomic.filter(({ type }) =>
    ['sum', 'subtract', 'set_if_not_exists'].includes(type),
  );

  const withSet = operationsThatUseSet.reduce(
    (acc, next) =>
      mergeSameOperationExpressions('SET', acc, atomicExpressionBuilders[next.type](next)),
    currentExpression,
  );

  return withSet;
}

function addAtomicAddUpdates(
  atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
  currentExpression: string,
): string {
  const addOperations = atomic.filter(({ type }) => type === 'add' || type === 'add_to_set');

  if (!addOperations.length) return currentExpression;

  const addExpression = addOperations.reduce(
    (acc, next) =>
      mergeSameOperationExpressions('ADD', acc, atomicExpressionBuilders[next.type](next)),
    '' as string, // ts compiler was wrongly complaining,
  );

  return `${currentExpression}${currentExpression.length ? ' ' : ''}${addExpression}`;
}

function addAtomicRemoveUpdates(
  atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
  currentExpression: string,
): string {
  const addOperations = atomic.filter(({ type }) => type === 'remove_from_set');

  if (!addOperations.length) return currentExpression;

  const addExpression = addOperations.reduce(
    (acc, next) =>
      mergeSameOperationExpressions('DELETE', acc, atomicExpressionBuilders[next.type](next)),
    '' as string, // ts compiler was wrongly complaining,
  );

  return `${currentExpression}${currentExpression.length ? ' ' : ''}${addExpression}`;
}

function addAtomicUpdates(
  atomic: UpdateParams<any>['atomicOperations'],
  currentExpression: string,
): string {
  if (!atomic?.length) return currentExpression;

  const final = [addAtomicSetUpdates, addAtomicAddUpdates, addAtomicRemoveUpdates].reduce(
    (acc, resolver) => resolver(atomic, acc),
    currentExpression,
  );

  return final;
}

function addRemovePropertiesUpdates(
  properties: UpdateParams<any>['remove'],
  currentExpression: string,
): string {
  if (!properties?.length) return currentExpression;

  const removeExpression = properties.reduce(
    (acc, next) => mergeSameOperationExpressions('REMOVE', acc, toExpressionName(next)),
    '' as string, // ts compiler was wrongly complaining,
  );

  return `${currentExpression}${currentExpression.length ? ' ' : ''}${removeExpression}`;
}

export function buildUpdateExpression({
  atomicOperations,
  remove,
  values,
}: Pick<UpdateParams<any>, 'atomicOperations' | 'values' | 'remove'>): string {
  // starts with SET
  const valuesExpression = getValuesUpdateExpression(values);

  const withAtomic = addAtomicUpdates(atomicOperations, valuesExpression);

  return addRemovePropertiesUpdates(remove, withAtomic);
}
