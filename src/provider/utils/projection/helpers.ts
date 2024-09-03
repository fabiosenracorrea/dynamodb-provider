import { AnyObject } from 'types';

import { DBProjectionParams } from '../dynamoDB';

import { getExpressionNames, toExpressionName } from '../expressions';

const PROJECT_EXPRESSION_PREFIX = '__projection_';

export function getProjectionExpression(properties?: string[] | undefined): string | undefined {
  if (!properties?.length) return;

  return properties
    .map((prop) => toExpressionName(`${PROJECT_EXPRESSION_PREFIX}${prop}`))
    .join(', ');
}

export function getProjectionExpressionNames(properties?: string[] | undefined): AnyObject {
  if (!properties?.length) return {};

  return getExpressionNames(properties, PROJECT_EXPRESSION_PREFIX);
}

export function getProjectExpressionParams(properties?: string[] | undefined): DBProjectionParams {
  if (!properties?.length) return {};

  return {
    ProjectionExpression: getProjectionExpression(properties),

    ExpressionAttributeNames: getProjectionExpressionNames(properties),
  };
}
