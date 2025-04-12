import { buildExpression, getExpression } from './expressions';

describe('expression builder', () => {
  describe('single expressions', () => {
    it('should properly create the *equal* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'equal',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} = :${prop})`);
    });

    it('should properly create the *not_equal* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'not_equal',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} <> :${prop})`);
    });

    it('should properly create the *lower_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'lower_than',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} < :${prop})`);
    });

    it('should properly create the *lower_or_equal_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'lower_or_equal_than',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} <= :${prop})`);
    });

    it('should properly create the *bigger_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'bigger_than',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} > :${prop})`);
    });

    it('should properly create the *bigger_or_equal_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'bigger_or_equal_than',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} >= :${prop})`);
    });

    it('should properly create the *begins_with* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'begins_with',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(begins_with(#${prop}, :${prop}))`);
    });

    it('should properly create the *contains* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'contains',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(contains(#${prop}, :${prop}))`);
    });

    it('should properly create the *not_contains* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'not_contains',
          property: prop,
          value: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(not contains(#${prop}, :${prop}))`);
    });

    it('should properly create the *exists* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'exists',
          property: prop,
        },
      ]);

      expect(expression).toBe(`(attribute_exists(#${prop}))`);
    });

    it('should properly create the *not_exists* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'not_exists',
          property: prop,
        },
      ]);

      expect(expression).toBe(`(attribute_not_exists(#${prop}))`);
    });

    it('should properly create the *in* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const values = [1, 2, 3, 4];

      const toName = (p: string, index: number) => `:${p}_${index}`;
      const valueString = values.map((_, index) => toName(prop, index)).join(',');

      const expression = buildExpression([
        {
          operation: 'in',
          property: prop,
          values,
        },
      ]);

      expect(expression).toBe(`(#${prop} in (${valueString}))`);
    });

    it('should properly create the *not_in* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const values = [1, 2, 3, 4];

      const toName = (p: string, index: number) => `:${p}_${index}`;
      const valueString = values.map((_, index) => toName(prop, index)).join(',');

      const expression = buildExpression([
        {
          operation: 'not_in',
          property: prop,
          values,
        },
      ]);

      expect(expression).toBe(`(not #${prop} in (${valueString}))`);
    });

    it('should properly create the *between* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';

      const expression = buildExpression([
        {
          operation: 'between',
          property: prop,
          start: 'NOT_IMPORTANT',
          end: 'NOT_IMPORTANT',
        },
      ]);

      expect(expression).toBe(`(#${prop} between :${prop}_start and :${prop}_end)`);
    });

    it('should properly prefix the *equal* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'equal',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} = :${prefix}${prop})`);
    });

    it('should properly prefix the *not_equal* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'not_equal',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} <> :${prefix}${prop})`);
    });

    it('should properly prefix the *lower_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'lower_than',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} < :${prefix}${prop})`);
    });

    it('should properly prefix the *lower_or_equal_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'lower_or_equal_than',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} <= :${prefix}${prop})`);
    });

    it('should properly prefix the *bigger_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'bigger_than',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} > :${prefix}${prop})`);
    });

    it('should properly prefix the *bigger_or_equal_than* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'bigger_or_equal_than',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} >= :${prefix}${prop})`);
    });

    it('should properly prefix the *begins_with* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'begins_with',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(begins_with(#${prefix}${prop}, :${prefix}${prop}))`);
    });

    it('should properly prefix the *contains* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'contains',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(contains(#${prefix}${prop}, :${prefix}${prop}))`);
    });

    it('should properly prefix the *not_contains* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'not_contains',
            property: prop,
            value: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(not contains(#${prefix}${prop}, :${prefix}${prop}))`);
    });

    it('should properly prefix the *exists* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'exists',
            property: prop,
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(attribute_exists(#${prefix}${prop}))`);
    });

    it('should properly prefix the *not_exists* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'not_exists',
            property: prop,
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(attribute_not_exists(#${prefix}${prop}))`);
    });

    it('should properly prefix the *in* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const values = [1, 2, 3, 4];

      const toName = (p: string, index: number) => `:___prefix${p}_${index}`;
      const valueString = values.map((_, index) => toName(prop, index)).join(',');

      const expression = buildExpression(
        [
          {
            operation: 'in',
            property: prop,
            values,
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(#${prefix}${prop} in (${valueString}))`);
    });

    it('should properly prefix the *not_in* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const values = [1, 2, 3, 4];

      const toName = (p: string, index: number) => `:___prefix${p}_${index}`;
      const valueString = values.map((_, index) => toName(prop, index)).join(',');

      const expression = buildExpression(
        [
          {
            operation: 'not_in',
            property: prop,
            values,
          },
        ],
        prefix,
      );

      expect(expression).toBe(`(not #${prefix}${prop} in (${valueString}))`);
    });

    it('should properly prefix the *between* expression, prefixed correctly on prop/value', () => {
      const prop = 'some_prop';
      const prefix = '___prefix';

      const expression = buildExpression(
        [
          {
            operation: 'between',
            property: prop,
            start: 'NOT_IMPORTANT',
            end: 'NOT_IMPORTANT',
          },
        ],
        prefix,
      );

      expect(expression).toBe(
        `(#${prefix}${prop} between :${prefix}${prop}_start and :${prefix}${prop}_end)`,
      );
    });
  });

  describe('multi expressions', () => {
    it('*and* should be the default expression joiner', () => {
      const expression = buildExpression([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'NOT_IMPORTANT',
        },
        {
          operation: 'in',
          property: 'other_prop',
          values: ['NOT_IMPORTANT'],
        },
      ]);

      expect(expression).toBe(`(#some_prop = :some_prop) and (#other_prop in (:other_prop_0))`);
    });

    it('should be able to handle 2 expressions with *and*', () => {
      const expression = buildExpression([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'NOT_IMPORTANT',
        },
        {
          operation: 'in',
          property: 'other_prop',
          values: ['NOT_IMPORTANT'],
          joinAs: 'and',
        },
      ]);

      expect(expression).toBe(`(#some_prop = :some_prop) and (#other_prop in (:other_prop_0))`);
    });

    it('should be able to handle 2 of the same expression with *and*', () => {
      const expression = buildExpression([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'NOT_IMPORTANT',
        },
        {
          operation: 'equal',
          property: 'other_prop',
          value: 'NOT_IMPORTANT',
          joinAs: 'and',
        },
      ]);

      expect(expression).toBe(`(#some_prop = :some_prop) and (#other_prop = :other_prop)`);
    });

    it('should be able to handle 2 expressions with *or*', () => {
      const expression = buildExpression([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'NOT_IMPORTANT',
        },
        {
          operation: 'in',
          property: 'other_prop',
          values: ['NOT_IMPORTANT'],
          joinAs: 'or',
        },
      ]);

      expect(expression).toBe(`(#some_prop = :some_prop) or (#other_prop in (:other_prop_0))`);
    });

    it('should be able to handle 2 of the same expression with *or*', () => {
      const expression = buildExpression([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'NOT_IMPORTANT',
        },
        {
          operation: 'equal',
          property: 'other_prop',
          value: 'NOT_IMPORTANT',
          joinAs: 'or',
        },
      ]);

      expect(expression).toBe(`(#some_prop = :some_prop) or (#other_prop = :other_prop)`);
    });

    it('should be able to handle complex expressions with *and* + *or*', () => {
      const expression = buildExpression([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'NOT_IMPORTANT',
        },
        {
          operation: 'in',
          property: 'in_prop',
          values: ['NOT_IMPORTANT'],
          joinAs: 'or',
        },
        {
          operation: 'between',
          property: 'between_prop',
          joinAs: 'and',
          start: '',
          end: '',
        },
        {
          operation: 'not_exists',
          property: 'exists_prop',
          joinAs: 'or',
        },
        {
          operation: 'not_contains',
          property: 'contains_prop',
          value: 'sss',
        },
      ]);

      expect(expression).toBe(
        [
          '(#some_prop = :some_prop)',
          'or (#in_prop in (:in_prop_0))',
          'and (#between_prop between :between_prop_start and :between_prop_end)',
          'or (attribute_not_exists(#exists_prop))',
          'and (not contains(#contains_prop, :contains_prop))',
        ].join(' '),
      );
    });
  });

  describe('get expression type helper', () => {
    it('should just return its parameter', () => {
      const config = {
        operation: 'equal' as const,
        property: 'some',
        value: 1,
      };

      expect(getExpression(config)).toBe(config);
    });
  });
});
