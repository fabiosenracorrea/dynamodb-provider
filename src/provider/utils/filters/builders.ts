/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDB } from 'aws-sdk';

import { AnyObject } from 'types';

import { cascadeEval, quickSwitch } from 'utils/conditions';
import {
  buildExpression,
  buildExpressionAttributeValues,
  getExpression,
  getExpressionNames,
  getExpressionValues,
} from '../expressions';

import {
  BasicFilterConfig,
  BetweenFilterConfig,
  FilterConfig,
  Filters,
  ListFilterConfig,
} from './types';

// This ensures values used for filter do not interfere with other values from conditions etc
const FILTER_PREFIX = '__filter_';

function buildFilterExpressionValuesAndExpression<Entity extends AnyObject>(
  filters: Filters<Entity>,
): Pick<DynamoDB.DocumentClient.ScanInput, 'FilterExpression' | 'ExpressionAttributeValues'> {
  const direct = Object.entries(filters).filter(([, value]) => typeof value !== 'object');

  const conditions = Object.entries(filters)
    .filter(([, value]) => typeof value === 'object' && !Array.isArray(value))
    .map(([property, config]) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...getExpression(config as any),
      property,
    }));

  const listConditions = Object.entries(filters)
    .filter(([, value]) => Array.isArray(value))
    .map(([property, values]) =>
      getExpression({
        operation: 'in',
        property,
        values: values as string[],
      }),
    );

  const allConditions = [...conditions, ...listConditions];

  return {
    FilterExpression: buildExpression(allConditions, FILTER_PREFIX),

    ExpressionAttributeValues: {
      ...buildExpressionAttributeValues(Object.fromEntries(direct), FILTER_PREFIX),

      ...getExpressionValues(allConditions, FILTER_PREFIX),
    },
  };
}

function purgeUndefinedFilters<Entity extends AnyObject>(
  filters: Filters<Entity>,
): Filters<Entity> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) =>
      cascadeEval([
        { is: Array.isArray(value), then: () => (value as any[]).filter(Boolean).length },
        {
          is: typeof value === 'object',
          then: () =>
            quickSwitch((value as FilterConfig).operation, [
              { is: ['exists', 'not_exists'], then: true },
              {
                is: 'begins_with',
                then: !!(
                  (value as BetweenFilterConfig)?.high && (value as BetweenFilterConfig)?.low
                ),
              },
              {
                is: ['in', 'not_in'],
                then: () => (value as ListFilterConfig).values.length,
              },
              {
                is: true,
                then: (value as BasicFilterConfig).value !== undefined,
              },
            ]),
        },
        { is: true, then: value !== undefined },
      ]),
    ),
  ) as Filters<Entity>;
}

export function getFilterParams<Entity extends AnyObject>(
  filters?: Filters<Entity>,
): Pick<
  DynamoDB.DocumentClient.ScanInput,
  'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
> {
  if (!filters) return {};

  const actualValues = purgeUndefinedFilters(filters);

  const properties = Object.keys(actualValues);

  if (!properties.length) return {};

  return {
    ...buildFilterExpressionValuesAndExpression(actualValues),

    ExpressionAttributeNames: getExpressionNames(properties, FILTER_PREFIX),
  };
}
