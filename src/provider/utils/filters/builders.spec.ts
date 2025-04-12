import {
  buildFilterExpressionValuesAndExpression,
  getFilterParams,
  purgeUndefinedFilters,
} from './builders';

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
          '(#__filter_age in (:__filter_age_0,:__filter_age_1,:__filter_age_2)) and (#__filter_status in (:__filter_status_0,:__filter_status_1,:__filter_status_2))',

        ExpressionAttributeValues: {
          ':__filter_status_0': '0',
          ':__filter_status_1': '2',
          ':__filter_status_2': '9',
          ':__filter_age_0': 24,
          ':__filter_age_1': 26,
          ':__filter_age_2': 28,
        },
      });
    });

    it('should handle expression configuration', () => {
      const result = buildFilterExpressionValuesAndExpression<{ status: string; age: number }>({
        status: {
          operation: 'between',
          end: '9',
          start: '1',
        },

        age: {
          operation: 'bigger_or_equal_than',
          value: 18,
        },
      });

      expect(result).toEqual({
        FilterExpression:
          '(#__filter_status between :__filter_status_start and :__filter_status_end) and (#__filter_age >= :__filter_age)',

        ExpressionAttributeValues: {
          ':__filter_age': 18,
          ':__filter_status_start': '1',
          ':__filter_status_end': '9',
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
          end: '2024-08-31T23:59:59.999Z',
          start: '2024-08-01T00:00:00.000Z',
        },
      });

      expect(result).toEqual({
        FilterExpression: [
          '(#__filter_status = :__filter_status)',
          'and (#__filter_age > :__filter_age)',
          'and (#__filter_startedAt between :__filter_startedAt_start and :__filter_startedAt_end)',
          'and (#__filter_counts in (:__filter_counts_0,:__filter_counts_1,:__filter_counts_2,:__filter_counts_3))',
        ].join(' '),

        ExpressionAttributeValues: {
          ':__filter_age': 21,
          ':__filter_status': '0',
          ':__filter_counts_0': 10,
          ':__filter_counts_1': 20,
          ':__filter_counts_2': 30,
          ':__filter_counts_3': 40,
          ':__filter_startedAt_start': '2024-08-01T00:00:00.000Z',
          ':__filter_startedAt_end': '2024-08-31T23:59:59.999Z',
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

          startedAt: {
            operation: 'between',
            end: '2024-08-31T23:59:59.999Z',
            start: undefined,
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

  describe('filter params getter', () => {
    it('should return empty object if no params', () => {
      expect(getFilterParams()).toEqual({});
    });

    it('should return empty object if only nullable params', () => {
      expect(
        getFilterParams({
          some: null,
          other: undefined,
          hello: [],
        }),
      ).toEqual({});
    });

    it('should handle direct + lists + expressions, handling direct then expressions then lists', () => {
      const result = getFilterParams({
        status: '0',

        other: null,

        remove: [],

        age: {
          operation: 'bigger_than',
          value: 21,
        },

        counts: [10, 20, 30, 40, undefined],

        startedAt: {
          operation: 'between',
          end: '2024-08-31T23:59:59.999Z',
          start: '2024-08-01T00:00:00.000Z',
        },
      });

      expect(result).toEqual({
        FilterExpression: [
          '(#__filter_status = :__filter_status)',
          'and (#__filter_age > :__filter_age)',
          'and (#__filter_startedAt between :__filter_startedAt_start and :__filter_startedAt_end)',
          'and (#__filter_counts in (:__filter_counts_0,:__filter_counts_1,:__filter_counts_2,:__filter_counts_3))',
        ].join(' '),

        ExpressionAttributeValues: {
          ':__filter_age': 21,
          ':__filter_status': '0',
          ':__filter_startedAt_start': '2024-08-01T00:00:00.000Z',
          ':__filter_startedAt_end': '2024-08-31T23:59:59.999Z',
          ':__filter_counts_0': 10,
          ':__filter_counts_1': 20,
          ':__filter_counts_2': 30,
          ':__filter_counts_3': 40,
        },

        ExpressionAttributeNames: {
          '#__filter_age': 'age',
          '#__filter_status': 'status',
          '#__filter_counts': 'counts',
          '#__filter_startedAt': 'startedAt',
        },
      });
    });
  });
});
