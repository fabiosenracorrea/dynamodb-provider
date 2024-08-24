import { buildFilterExpressionValuesAndExpression, purgeUndefinedFilters } from './builders';

describe('filter helpers', () => {
  describe('filter expression + values', () => {
    it('should handle direct filters, properly prefixed', () => {
      const filters = {
        age: 24,
        count: 10,
      };

      const result = buildFilterExpressionValuesAndExpression(filters);

      expect(result).toEqual({
        FilterExpression: '(#__filter_age = :__filter_age) and (#__filter_count = :__filter_count)',

        ExpressionAttributeValues: {
          ':__filter_age': 24,
          ':__filter_count': 10,
        },
      });
    });

    it('should handle direct array filters, properly prefixed', () => {
      const filters = {
        age: [24, 26, 28],
        status: ['0', '2', '9'],
      };

      const result = buildFilterExpressionValuesAndExpression(filters);

      expect(result).toEqual({
        FilterExpression:
          '(#__filter_age in :__filter_age) and (#__filter_status in :__filter_status)',

        ExpressionAttributeValues: {
          ':__filter_age': [24, 26, 28],
          ':__filter_status': ['0', '2', '9'],
        },
      });
    });

    it('should handle expression configuration', () => {
      const result = buildFilterExpressionValuesAndExpression<{ status: string; age: number }>({
        status: {
          operation: 'between',
          high: '9',
          low: '1',
        },

        age: {
          operation: 'bigger_or_equal_than',
          value: 18,
        },
      });

      expect(result).toEqual({
        FilterExpression:
          '(#__filter_status between :__filter_status_low and :__filter_status_high) and (#__filter_age >= :__filter_age)',

        ExpressionAttributeValues: {
          ':__filter_age': 18,
          ':__filter_status_low': '1',
          ':__filter_status_high': '9',
        },
      });
    });

    it('should handle *or* cases', () => {
      const result = buildFilterExpressionValuesAndExpression<{ status: string; age: number }>({
        status: {
          operation: 'bigger_than',
          value: '4',
        },

        age: {
          operation: 'bigger_or_equal_than',
          value: 18,
          joinAs: 'or',
        },
      });

      expect(result).toEqual({
        FilterExpression:
          '(#__filter_status > :__filter_status) or (#__filter_age >= :__filter_age)',

        ExpressionAttributeValues: {
          ':__filter_age': 18,
          ':__filter_status': '4',
        },
      });
    });

    it('should handle direct + lists + expressions, handling direct then expressions then lists', () => {
      const result = buildFilterExpressionValuesAndExpression<{
        status: string;
        age: number;
        counts: number;
        startedAt: string;
      }>({
        status: '0',

        age: {
          operation: 'bigger_than',
          value: 21,
        },

        counts: [10, 20, 30, 40],

        startedAt: {
          operation: 'between',
          high: '2024-08-31T23:59:59.999Z',
          low: '2024-08-01T00:00:00.000Z',
        },
      });

      expect(result).toEqual({
        FilterExpression: [
          '(#__filter_status = :__filter_status)',
          'and (#__filter_age > :__filter_age)',
          'and (#__filter_startedAt between :__filter_startedAt_low and :__filter_startedAt_high)',
          'and (#__filter_counts in :__filter_counts)',
        ].join(' '),

        ExpressionAttributeValues: {
          ':__filter_age': 21,
          ':__filter_status': '0',
          ':__filter_counts': [10, 20, 30, 40],
          ':__filter_startedAt_low': '2024-08-01T00:00:00.000Z',
          ':__filter_startedAt_high': '2024-08-31T23:59:59.999Z',
        },
      });
    });
  });

  describe('filter purge helper', () => {
    it('should properly remove null/undefined direct values', () => {
      expect(
        purgeUndefinedFilters({
          some: null,
          other: undefined,
        }),
      ).toEqual({});
    });

    it('should properly keep non nullable falsy values', () => {
      expect(
        purgeUndefinedFilters({
          some: null,
          other: undefined,
          count: 0,
          no: false,
          char: '',
        }),
      ).toEqual({
        count: 0,
        no: false,
        char: '',
      });
    });

    it('should properly remove remove empty, nullable lists', () => {
      expect(
        purgeUndefinedFilters({
          some: [null, 2],
          other: [null, undefined],
          count: [0],
          no: [false],
          char: [''],
          hello: 'fala',
        }),
      ).toEqual({
        some: [2],
        count: [0],
        no: [false],
        char: [''],
        hello: 'fala',
      });
    });

    it('should properly purge expressions', () => {
      expect(
        purgeUndefinedFilters({
          some: {
            operation: 'in',
            values: [null, 2, 8, undefined],
          },

          other: {
            operation: 'equal',
            value: null,
          },

          age: {
            operation: 'not_in',
            values: [3, null, 14, undefined],
          },
        }),
      ).toEqual({
        some: {
          operation: 'in',
          values: [2, 8],
        },

        age: {
          operation: 'not_in',
          values: [3, 14],
        },
      });
    });

    it('should properly purge mixed filters', () => {
      expect(
        purgeUndefinedFilters({
          some: {
            operation: 'in',
            values: [null, 2, 8, undefined],
          },

          remove: null,

          purgeThis: [null, undefined],

          keepZero: [0],

          no: false,

          other: {
            operation: 'equal',
            value: null,
          },

          age: {
            operation: 'not_in',
            values: [3, null, 14, undefined],
          },

          status: {
            operation: 'lower_than',
            value: '9',
          },
        }),
      ).toEqual({
        some: {
          operation: 'in',
          values: [2, 8],
        },

        keepZero: [0],

        no: false,

        age: {
          operation: 'not_in',
          values: [3, 14],
        },

        status: {
          operation: 'lower_than',
          value: '9',
        },
      });
    });
  });
});
