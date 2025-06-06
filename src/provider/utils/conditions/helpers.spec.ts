import {
  buildConditionExpression,
  getConditionExpressionNames,
  getConditionExpressionValues,
  getConditionParams,
} from './helpers';
import { buildExpression, getExpressionNames, getExpressionValues } from '../expressions';

describe('condition expression helpers', () => {
  it('buildConditionExpression: should properly use the buildExpression with the condition prefix', () => {
    const conditions = [
      {
        operation: 'equal' as const,
        value: 20,
        property: 'some',
      },
      {
        operation: 'in' as const,
        values: [1, 2, 3],
        property: 'list',
      },
    ];

    const prefix = '__condition_';

    const result = buildConditionExpression(conditions);

    expect(result).toEqual(buildExpression(conditions, prefix));
  });

  it('getConditionExpressionNames: should properly use the getExpressionNames with the condition prefix, passing all properties', () => {
    const conditions = [
      {
        operation: 'equal' as const,
        value: 20,
        property: 'some',
      },
      {
        operation: 'in' as const,
        values: [1, 2, 3],
        property: 'list',
      },
    ];

    const prefix = '__condition_';

    const result = getConditionExpressionNames(conditions);
    const expected = getExpressionNames(['some', 'list'], prefix);

    expect(result).toEqual(expected);
  });

  it('getConditionExpressionValues: should properly use the getExpressionValues with the condition prefix', () => {
    const conditions = [
      {
        operation: 'equal' as const,
        value: 20,
        property: 'some',
      },
      {
        operation: 'in' as const,
        values: [1, 2, 3],
        property: 'list',
      },
    ];

    const prefix = '__condition_';

    const result = getConditionExpressionValues(conditions);

    expect(result).toEqual(getExpressionValues(conditions, prefix));
  });

  it('getConditionParams: should create all dynamodb params for a condition to be passed in', () => {
    const conditions = [
      {
        operation: 'equal' as const,
        value: 20,
        property: 'some',
      },
      {
        operation: 'in' as const,
        values: [1, 2, 3],
        property: 'list',
      },
    ];

    const params = getConditionParams(conditions);

    expect(params).toStrictEqual({
      ConditionExpression: conditions.length ? buildConditionExpression(conditions) : undefined,

      ExpressionAttributeNames: getConditionExpressionNames(conditions),

      ExpressionAttributeValues: getConditionExpressionValues(conditions),
    });
  });

  it('getConditionParams: should return empty object with invalid params', () => {
    expect(getConditionParams()).toStrictEqual({});
    expect(getConditionParams([])).toStrictEqual({});
  });
});
