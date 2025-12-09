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

  it('getConditionParams: should set ExpressionAttributeValues to undefined when only exists/not_exists operations are used', () => {
    const conditions = [
      {
        operation: 'exists' as const,
        property: 'field1',
      },
      {
        operation: 'not_exists' as const,
        property: 'field2',
      },
    ];

    const params = getConditionParams(conditions);

    expect(params).toStrictEqual({
      ConditionExpression: buildConditionExpression(conditions),
      ExpressionAttributeNames: getConditionExpressionNames(conditions),
      ExpressionAttributeValues: undefined,
    });
  });

  it('getConditionParams: should include ExpressionAttributeValues when mixing exists/not_exists with value operations', () => {
    const conditions = [
      {
        operation: 'exists' as const,
        property: 'field1',
      },
      {
        operation: 'equal' as const,
        property: 'field2',
        value: 'test',
      },
    ];

    const params = getConditionParams(conditions);

    expect(params.ExpressionAttributeValues).toBeDefined();
    expect(params.ExpressionAttributeValues).toEqual({
      ':__condition_field2': 'test',
    });
  });

  it('getConditionParams: should handle single condition', () => {
    const conditions = [
      {
        operation: 'equal' as const,
        property: 'status',
        value: 'active',
      },
    ];

    const params = getConditionParams(conditions);

    expect(params).toStrictEqual({
      ConditionExpression: buildConditionExpression(conditions),
      ExpressionAttributeNames: getConditionExpressionNames(conditions),
      ExpressionAttributeValues: getConditionExpressionValues(conditions),
    });
  });

  it('getConditionParams: should handle between operation', () => {
    const conditions = [
      {
        operation: 'between' as const,
        property: 'age',
        start: 18,
        end: 65,
      },
    ];

    const params = getConditionParams(conditions);

    expect(params.ExpressionAttributeValues).toEqual({
      ':__condition_age_start': 18,
      ':__condition_age_end': 65,
    });
  });

  it('getConditionParams: should handle complex nested conditions', () => {
    const conditions = [
      {
        operation: 'equal' as const,
        property: 'status',
        value: 'active',
        nested: [
          {
            operation: 'bigger_than' as const,
            property: 'count',
            value: 10,
          },
        ],
      },
    ];

    const params = getConditionParams(conditions);

    expect(params.ConditionExpression).toContain('__condition_status');
    expect(params.ConditionExpression).toContain('__condition_count');
    expect(params.ExpressionAttributeNames).toEqual({
      '#__condition_status': 'status',
      '#__condition_count': 'count',
    });
    expect(params.ExpressionAttributeValues).toEqual({
      ':__condition_status': 'active',
      ':__condition_count': 10,
    });
  });

  describe('edge cases', () => {
    it('buildConditionExpression: should handle empty array', () => {
      const result = buildConditionExpression([]);

      expect(result).toBe('');
    });

    it('getConditionExpressionNames: should handle single property', () => {
      const conditions = [
        {
          operation: 'equal' as const,
          property: 'id',
          value: '123',
        },
      ];

      const result = getConditionExpressionNames(conditions);

      expect(result).toEqual({
        '#__condition_id': 'id',
      });
    });

    it('getConditionExpressionValues: should handle list operations', () => {
      const conditions = [
        {
          operation: 'in' as const,
          property: 'category',
          values: ['a', 'b', 'c'],
        },
        {
          operation: 'not_in' as const,
          property: 'tags',
          values: [1, 2],
        },
      ];

      const result = getConditionExpressionValues(conditions);

      expect(result).toEqual({
        ':__condition_category_0': 'a',
        ':__condition_category_1': 'b',
        ':__condition_category_2': 'c',
        ':__condition_tags_0': 1,
        ':__condition_tags_1': 2,
      });
    });

    it('getConditionExpressionValues: should return empty object for exists/not_exists only', () => {
      const conditions = [
        {
          operation: 'exists' as const,
          property: 'field1',
        },
        {
          operation: 'not_exists' as const,
          property: 'field2',
        },
      ];

      const result = getConditionExpressionValues(conditions);

      expect(result).toEqual({});
    });

    it('getConditionParams: should handle all comparison operations', () => {
      const conditions = [
        {
          operation: 'equal' as const,
          property: 'field1',
          value: 1,
        },
        {
          operation: 'not_equal' as const,
          property: 'field2',
          value: 2,
          joinAs: 'and' as const,
        },
        {
          operation: 'lower_than' as const,
          property: 'field3',
          value: 3,
          joinAs: 'and' as const,
        },
        {
          operation: 'lower_or_equal_than' as const,
          property: 'field4',
          value: 4,
          joinAs: 'and' as const,
        },
        {
          operation: 'bigger_than' as const,
          property: 'field5',
          value: 5,
          joinAs: 'and' as const,
        },
        {
          operation: 'bigger_or_equal_than' as const,
          property: 'field6',
          value: 6,
          joinAs: 'and' as const,
        },
      ];

      const params = getConditionParams(conditions);

      expect(params.ExpressionAttributeValues).toEqual({
        ':__condition_field1': 1,
        ':__condition_field2': 2,
        ':__condition_field3': 3,
        ':__condition_field4': 4,
        ':__condition_field5': 5,
        ':__condition_field6': 6,
      });
    });

    it('getConditionParams: should handle string operations', () => {
      const conditions = [
        {
          operation: 'begins_with' as const,
          property: 'name',
          value: 'John',
        },
        {
          operation: 'contains' as const,
          property: 'description',
          value: 'keyword',
          joinAs: 'and' as const,
        },
        {
          operation: 'not_contains' as const,
          property: 'tags',
          value: 'excluded',
          joinAs: 'and' as const,
        },
      ];

      const params = getConditionParams(conditions);

      expect(params.ExpressionAttributeValues).toEqual({
        ':__condition_name': 'John',
        ':__condition_description': 'keyword',
        ':__condition_tags': 'excluded',
      });
    });

    it('getConditionParams: should verify condition prefix is __condition_', () => {
      const conditions = [
        {
          operation: 'equal' as const,
          property: 'test',
          value: 'value',
        },
      ];

      const params = getConditionParams(conditions);

      expect(params.ConditionExpression).toContain('#__condition_test');
      expect(params.ConditionExpression).toContain(':__condition_test');
      expect(params.ExpressionAttributeNames).toHaveProperty('#__condition_test');
      expect(params.ExpressionAttributeValues).toHaveProperty(':__condition_test');
    });

    it('getConditionParams: should handle mixed joinAs operators', () => {
      const conditions = [
        {
          operation: 'equal' as const,
          property: 'status',
          value: 'active',
        },
        {
          operation: 'bigger_than' as const,
          property: 'age',
          value: 18,
          joinAs: 'or' as const,
        },
        {
          operation: 'exists' as const,
          property: 'verified',
          joinAs: 'and' as const,
        },
      ];

      const params = getConditionParams(conditions);

      expect(params.ConditionExpression).toContain('or');
      expect(params.ConditionExpression).toContain('and');
    });
  });
});
