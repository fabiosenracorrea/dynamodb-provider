/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';
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
