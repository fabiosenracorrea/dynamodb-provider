/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';
import { DynamoDB } from 'aws-sdk';
import {
  buildExpression,
  getExpressionNames,
  getExpressionValues,
  ItemExpression,
} from '../expressions';

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

export function getConditionParams(conditions?: ItemExpression<any>[]): Pick<
  // It does not matter which input we reference these from
  DynamoDB.DocumentClient.PutItemInput,
  'ConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
> {
  if (!conditions?.length) return {};

  return {
    ConditionExpression: conditions.length ? buildConditionExpression(conditions) : undefined,

    ExpressionAttributeNames: getConditionExpressionNames(conditions),

    ExpressionAttributeValues: getConditionExpressionValues(conditions),
  };
}
