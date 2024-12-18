/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import {
  buildExpression,
  getExpressionNames,
  getExpressionValues,
  ItemExpression,
} from '../expressions';
import { DBConditionParams } from '../dynamoDB';

const CONDITION_PREFIX = '__condition_';

export function buildConditionExpression(conditions: ItemExpression<any>[]): string {
  return buildExpression(conditions, CONDITION_PREFIX);
}

export function getConditionExpressionNames(conditions: ItemExpression<any>[]): AnyObject {
  return getExpressionNames(
    conditions.map(({ property }) => property),
    CONDITION_PREFIX,
  );
}

export function getConditionExpressionValues(conditions: ItemExpression<any>[]): AnyObject {
  return getExpressionValues(conditions, CONDITION_PREFIX);
}

export function getConditionParams(conditions?: ItemExpression<any>[]): DBConditionParams {
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
