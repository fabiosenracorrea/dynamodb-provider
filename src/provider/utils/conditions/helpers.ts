/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import {
  buildExpression,
  getExpressionValues,
  getPropertyCounter,
  ItemExpression,
  toExpressionName,
} from '../expressions';
import { DBConditionParams } from '../dynamoDB';

const CONDITION_PREFIX = '__condition_';

export function buildConditionExpression(conditions: ItemExpression<any>[]): string {
  return buildExpression(conditions, CONDITION_PREFIX);
}

function getConditionProps(conditions: ItemExpression<any>[]): string[] {
  return conditions
    .map(({ property, nested }) => [
      property,
      ...(nested?.length ? getConditionProps(nested) : []),
    ])
    .flat();
}

/**
 * Repeat references get counted keys to match `buildExpression`,
 * while still pointing to the same attribute name
 */
export function getConditionExpressionNames(
  conditions: ItemExpression<any>[],
): AnyObject {
  const propCounter = getPropertyCounter();

  return Object.fromEntries(
    getConditionProps(conditions).map((property) => [
      toExpressionName(`${CONDITION_PREFIX}${propCounter.withCountedSuffix(property)}`),
      property,
    ]),
  );
}

function flatConditions(conditions: ItemExpression<any>[]): ItemExpression<any>[] {
  return conditions
    .map(({ nested, ...cond }) => [
      cond,
      ...(nested?.length ? flatConditions(nested) : []),
    ])
    .flat();
}

export function getConditionExpressionValues(
  conditions: ItemExpression<any>[],
): AnyObject {
  const propCounter = getPropertyCounter();

  const flat = flatConditions(conditions).map(({ property, ...rest }) => ({
    ...rest,
    property: propCounter.withCountedSuffix(property),
  }));

  return getExpressionValues(flat, CONDITION_PREFIX);
}

export function getConditionParams(
  conditions?: ItemExpression<any>[],
): DBConditionParams {
  if (!conditions?.length) return {};

  const ExpressionAttributeValues = getConditionExpressionValues(conditions);

  const hasAnyValue = !!Object.keys(ExpressionAttributeValues).length;

  return {
    ConditionExpression: buildConditionExpression(conditions),

    ExpressionAttributeNames: getConditionExpressionNames(conditions),

    // exists/not_exists attribute check does not require values
    ExpressionAttributeValues: hasAnyValue ? ExpressionAttributeValues : undefined,
  };
}
