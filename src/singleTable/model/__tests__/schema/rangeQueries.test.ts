/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter } from 'types';

import { SingleTableSchema } from '../../schema';
import { tableConfig, User } from './helpers.test';

const simpleOps = [
  'equal',
  'lower_than',
  'lower_or_equal_than',
  'bigger_than',
  'bigger_or_equal_than',
  'begins_with',
] as const;

describe('single table schema - entity - rangeQueries', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should handle simple value queries [default behavior - no _getValues_ fn]', () => {
    simpleOps.forEach((operation, index) => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: `USER_${index}`,
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: () => ['#DATA'],

        rangeQueries: {
          from: {
            operation,
          },
        },
      });

      schema.from(user);

      expect(user.rangeQueries.from({ value: '100' })).toStrictEqual({
        operation,
        value: '100',
      });

      // -- TYPES --

      type _Tests = [
        //
        Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.from>, 'value'>>,
      ];
    });
  });

  it('should handle simple value queries [custom getValues - no params]', () => {
    simpleOps.forEach((operation, index) => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: `USER_${index}`,
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: () => ['#DATA'],
        rangeQueries: {
          from: {
            operation,
            getValues: () => ({ value: 'nop!' }),
          },
        },
      });

      schema.from(user);

      expect(user.rangeQueries.from()).toStrictEqual({
        operation,
        value: 'nop!',
      });

      // -- TYPES --

      type _Tests = [
        //
        Expect<Equal<FirstParameter<typeof user.rangeQueries.from>, undefined>>,
      ];
    });
  });

  it('should handle simple value queries [custom getValues - params]', () => {
    simpleOps.forEach((operation, index) => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: `USER_${index}`,
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: () => ['#DATA'],
        rangeQueries: {
          from: {
            operation,
            getValues: ({ value1, value2 }: { value1: string; value2: number }) => ({
              value: [value1, value2].join('-'),
            }),
          },
        },
      });

      schema.from(user);

      expect(
        user.rangeQueries.from({
          value1: 'some',
          value2: 1,
        }),
      ).toStrictEqual({
        operation,
        value: 'some-1',
      });

      // -- TYPES --

      type _Tests = [
        Expect<
          Equal<
            FirstParameter<typeof user.rangeQueries.from>,
            { value1: string; value2: number }
          >
        >,
      ];
    });
  });

  it('should handle between [default behavior - no _getValues_ fn]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      rangeQueries: {
        range: {
          operation: 'between',
        },
      },
    });

    expect(
      user.rangeQueries.range({
        start: 'A',
        end: 'Z',
      }),
    ).toStrictEqual({
      operation: 'between',
      start: 'A',
      end: 'Z',
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<keyof FirstParameter<typeof user.rangeQueries.range>, 'start' | 'end'>
      >,
    ];
  });

  it('should handle between with params [custom getValues - no params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      rangeQueries: {
        aToF: {
          operation: 'between',
          getValues: () => ({
            start: 'a',
            end: 'f',
          }),
        },
      },
    });

    schema.from(user);

    expect(user.rangeQueries.aToF()).toStrictEqual({
      operation: 'between',
      start: 'a',
      end: 'f',
    });

    // -- TYPES --

    type _Test = Expect<Equal<FirstParameter<typeof user.rangeQueries.aToF>, undefined>>;
  });

  it('should handle between with params [custom getValues - params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      rangeQueries: {
        dateRange: {
          operation: 'between',
          getValues: ({
            startDate,
            endDate,
          }: {
            startDate: string;
            endDate: string;
          }) => ({
            start: startDate,
            end: endDate,
          }),
        },
      },
    });

    schema.from(user);

    expect(
      user.rangeQueries.dateRange({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }),
    ).toStrictEqual({
      operation: 'between',
      start: '2024-01-01',
      end: '2024-12-31',
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<
          FirstParameter<typeof user.rangeQueries.dateRange>,
          { startDate: string; endDate: string }
        >
      >,
    ];
  });

  it('should handle multiple range queries with different param types', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      rangeQueries: {
        noParams: {
          operation: 'begins_with',
          getValues: () => ({
            value: 'STATIC',
          }),
        },
        singleParam: {
          operation: 'equal',
          getValues: ({ target }: { target: string }) => ({
            value: target,
          }),
        },
        multiParams: {
          operation: 'between',
          getValues: ({ from, to }: { from: string; to: string }) => ({
            start: from,
            end: to,
          }),
        },
        defaultBehavior: {
          operation: 'bigger_than',
        },
      },
    });

    schema.from(user);

    expect(user.rangeQueries.noParams()).toStrictEqual({
      operation: 'begins_with',
      value: 'STATIC',
    });

    expect(user.rangeQueries.singleParam({ target: 'TARGET' })).toStrictEqual({
      operation: 'equal',
      value: 'TARGET',
    });

    expect(user.rangeQueries.multiParams({ from: 'A', to: 'Z' })).toStrictEqual({
      operation: 'between',
      start: 'A',
      end: 'Z',
    });

    expect(user.rangeQueries.defaultBehavior({ value: '50' })).toStrictEqual({
      operation: 'bigger_than',
      value: '50',
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.rangeQueries.noParams>, undefined>>,
      Expect<
        Equal<FirstParameter<typeof user.rangeQueries.singleParam>, { target: string }>
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.rangeQueries.multiParams>,
          { from: string; to: string }
        >
      >,
      Expect<
        Equal<keyof FirstParameter<typeof user.rangeQueries.defaultBehavior>, 'value'>
      >,
    ];
  });

  it('should handle complex getValues transformations', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      rangeQueries: {
        emailPrefix: {
          operation: 'begins_with',
          getValues: ({ email }: { email: string }) => ({
            value: email.toLowerCase(),
          }),
        },
        dateRangeISO: {
          operation: 'between',
          getValues: ({ startDate, endDate }: { startDate: Date; endDate: Date }) => ({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          }),
        },
        numericThreshold: {
          operation: 'bigger_or_equal_than',
          getValues: ({ threshold }: { threshold: number }) => ({
            value: threshold.toString(),
          }),
        },
      },
    });

    schema.from(user);

    expect(user.rangeQueries.emailPrefix({ email: 'TEST@EXAMPLE.COM' })).toStrictEqual({
      operation: 'begins_with',
      value: 'test@example.com',
    });

    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-12-31T23:59:59.999Z');

    expect(
      user.rangeQueries.dateRangeISO({ startDate: start, endDate: end }),
    ).toStrictEqual({
      operation: 'between',
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-12-31T23:59:59.999Z',
    });

    expect(user.rangeQueries.numericThreshold({ threshold: 100 })).toStrictEqual({
      operation: 'bigger_or_equal_than',
      value: '100',
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.rangeQueries.emailPrefix>, { email: string }>
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.rangeQueries.dateRangeISO>,
          { startDate: Date; endDate: Date }
        >
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.rangeQueries.numericThreshold>,
          { threshold: number }
        >
      >,
    ];
  });

  describe('key_prefix operation', () => {
    it('should handle key_prefix with simple range key', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: () => ['#DATA'],

        rangeQueries: {
          dataPrefix: {
            operation: 'key_prefix',
          },
        },
      });

      schema.from(user);

      const result = user.rangeQueries.dataPrefix();

      expect(result).toStrictEqual({
        operation: 'begins_with',
        value: ['#DATA'],
      });

      // -- TYPES --

      type _Tests = [
        Expect<Equal<FirstParameter<typeof user.rangeQueries.dataPrefix>, undefined>>,
      ];

      // @ts-expect-error key_prefix should not accept parameters
      user.rangeQueries.dataPrefix({ any: 'value' });
    });

    it('should handle key_prefix with multi-part range key', () => {
      const schema = new SingleTableSchema(tableConfig);

      type Log = {
        id: string;
        level: string;
        timestamp: string;
      };

      const log = schema.createEntity<Log>().as({
        type: 'LOG',
        getPartitionKey: ({ id }: { id: string }) => ['LOG', id],
        getRangeKey: ({ level, timestamp }: Pick<Log, 'level' | 'timestamp'>) => [
          'ENTRY',
          level!,
          timestamp!,
        ],

        rangeQueries: {
          entryPrefix: {
            operation: 'key_prefix',
          },
        },
      });

      schema.from(log);

      // When called without params, getRangeKey won't have level/timestamp
      // so they'll be undefined, and prefix will stop at first undefined
      const result = log.rangeQueries.entryPrefix();

      expect(result).toStrictEqual({
        operation: 'begins_with',
        value: ['ENTRY'],
      });

      // -- TYPES --

      type _Tests = [Expect<Equal<Parameters<typeof log.rangeQueries.entryPrefix>, []>>];
    });

    it('should handle key_prefix alongside other query types', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: () => ['PROFILE', 'DATA'],

        rangeQueries: {
          profilePrefix: {
            operation: 'key_prefix',
          },
          exactMatch: {
            operation: 'equal',
          },
          rangeMatch: {
            operation: 'between',
          },
        },
      });

      schema.from(user);

      const prefixResult = user.rangeQueries.profilePrefix();
      expect(prefixResult).toStrictEqual({
        operation: 'begins_with',
        value: ['PROFILE', 'DATA'],
      });

      const exactResult = user.rangeQueries.exactMatch({ value: 'TEST' });
      expect(exactResult).toStrictEqual({
        operation: 'equal',
        value: 'TEST',
      });

      const rangeResult = user.rangeQueries.rangeMatch({ start: 'A', end: 'Z' });
      expect(rangeResult).toStrictEqual({
        operation: 'between',
        start: 'A',
        end: 'Z',
      });

      // -- TYPES --

      type _Tests = [
        Expect<Equal<FirstParameter<typeof user.rangeQueries.profilePrefix>, undefined>>,
        Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.exactMatch>, 'value'>>,
        Expect<
          Equal<
            keyof FirstParameter<typeof user.rangeQueries.rangeMatch>,
            'start' | 'end'
          >
        >,
      ];
    });

    it('should handle key_prefix with partial range key (some undefined values)', () => {
      const schema = new SingleTableSchema(tableConfig);

      type TimeseriesData = {
        id: string;
        year?: string;
        month?: string;
        day?: string;
      };

      const timeseries = schema.createEntity<TimeseriesData>().as({
        type: 'TIMESERIES',
        getPartitionKey: ({ id }: { id: string }) => ['TS', id],
        getRangeKey: ({
          year,
          month,
          day,
        }: Pick<TimeseriesData, 'year' | 'month' | 'day'>) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ['DATE', year, month, day] as any,

        rangeQueries: {
          datePrefix: {
            operation: 'key_prefix',
          },
        },
      });

      schema.from(timeseries);

      // When called, getRangeKey will get undefined for all optional params
      // so it should return just ['DATE']
      const result = timeseries.rangeQueries.datePrefix();

      expect(result).toStrictEqual({
        operation: 'begins_with',
        value: ['DATE'],
      });

      // -- TYPES --

      type _Tests = [
        Expect<Equal<Parameters<typeof timeseries.rangeQueries.datePrefix>, []>>,
      ];
    });

    it('should reject getValues in key_prefix type definition', () => {
      const schema = new SingleTableSchema(tableConfig);

      // -- TYPES ONLY --
      if (false as any) {
        schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            // @ts-expect-error key_prefix should not accept getValues
            invalidPrefix: {
              operation: 'key_prefix',
              getValues: () => ({ value: 'test' }),
            },
          },
        });
      }
    });
  });
});
