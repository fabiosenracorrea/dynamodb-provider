import { getRangeQueriesParams } from './range';

describe('single table model - getRangeQueriesParams', () => {
  it('should return an empty object if rangeQueries not provided', () => {
    const result = getRangeQueriesParams({});

    expect(result).toEqual({});
  });

  it('should return an empty object if rangeQueries is explicitly undefined', () => {
    const result = getRangeQueriesParams({ rangeQueries: undefined });

    expect(result).toEqual({});
  });

  it('should return operation + getValues result', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const op = Symbol('operation') as any as 'equal';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getValuesResult = { anything: 'here!', runtime: 'check' } as any;

    const basicRangeConfig = {
      operation: op,
      getValues: jest.fn((_p: { id: string }) => getValuesResult),
    };

    const { rangeQueries } = getRangeQueriesParams({
      rangeQueries: {
        queryById: basicRangeConfig,
      },
    });

    expect(rangeQueries).toHaveProperty('queryById');

    const valueParams = { id: 'test-id' };
    const expectedResult = { operation: op, ...getValuesResult };

    expect(rangeQueries.queryById(valueParams)).toEqual(expectedResult);
    expect(basicRangeConfig.getValues).toHaveBeenCalledWith(valueParams);

    // -- TYPES --

    // @ts-expect-error {id} is required
    rangeQueries.queryById();

    // @ts-expect-error {id} is required
    rangeQueries.queryById({});
  });

  it('should handle multiple range queries configurations', () => {
    const basicRangeConfig = {
      operation: 'equal' as const,
      getValues: jest.fn(({ id }: { id: string }) => ({ value: id })),
    };

    const betweenRangeConfig = {
      operation: 'between' as const,
      getValues: jest.fn(({ other }: { other: string }) => ({
        start: `${other}-start`,
        end: `${other}-end`,
      })),
    };

    const {
      rangeQueries: { queryById, queryBetween },
    } = getRangeQueriesParams({
      rangeQueries: {
        queryById: basicRangeConfig,
        queryBetween: betweenRangeConfig,
      },
    });

    const idParams = { id: 'test-id' };
    const expectedResultById = { operation: 'equal', value: idParams.id };

    expect(queryById(idParams)).toEqual(expectedResultById);
    expect(basicRangeConfig.getValues).toHaveBeenCalledWith(idParams);

    const expectedResultBetween = {
      operation: 'between',
      start: `${idParams.id}-start`,
      end: `${idParams.id}-end`,
    };

    expect(queryBetween({ other: idParams.id })).toEqual(expectedResultBetween);
    expect(betweenRangeConfig.getValues).toHaveBeenCalledWith({ other: idParams.id });

    // -- TYPES --

    // @ts-expect-error {id} is required
    expect(() => queryById()).toThrow();

    // @ts-expect-error {id} is required
    queryById({});

    // @ts-expect-error {id} is required
    queryById({ bad: 'string' });

    // @ts-expect-error param is required
    expect(() => queryBetween()).toThrow();

    // @ts-expect-error {other} is required
    queryBetween({});

    // @ts-expect-error {other} is required
    queryById({ bad: 'string' });
  });

  it('[basic operations] should default to _value_ if _getValues_ is not present', () => {
    const operations = [
      'equal',
      'lower_than',
      'lower_or_equal_than',
      'bigger_than',
      'bigger_or_equal_than',
      'begins_with',
    ] as const;

    operations.forEach((operation) => {
      const {
        rangeQueries: { myRange },
      } = getRangeQueriesParams({
        rangeQueries: {
          myRange: { operation },
        },
      });

      expect(myRange).toBeDefined();

      const result = myRange({
        value: 'something!',
      });

      expect(result).toEqual({
        value: 'something!',
        operation,
      });

      // -- TYPES --

      // @ts-expect-error params required
      myRange();

      // @ts-expect-error {value} required
      myRange({});
    });
  });

  it('[basic operations] should omit any other prop than _value_ if _getValues_ is not present', () => {
    const operations = [
      'equal',
      'lower_than',
      'lower_or_equal_than',
      'bigger_than',
      'bigger_or_equal_than',
      'begins_with',
    ] as const;

    operations.forEach((operation) => {
      const {
        rangeQueries: { myRange },
      } = getRangeQueriesParams({
        rangeQueries: {
          myRange: { operation },
        },
      });

      expect(myRange).toBeDefined();

      const result = myRange({
        value: 'something!',
        nest: true,
        test: 'ok',
        number: 12,
        _____internal: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(result).toEqual({
        value: 'something!',
        operation,
      });
    });
  });

  it('[between operation] should default to _start_ and _end_ if _getValues_ is not present', () => {
    const {
      rangeQueries: { myRange },
    } = getRangeQueriesParams({
      rangeQueries: {
        myRange: { operation: 'between' },
      },
    });

    expect(myRange).toBeDefined();

    const result = myRange({
      start: 'start!',
      end: 'end!',
      nest: true,
      test: 'ok',
      number: 12,
      _____internal: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(result).toEqual({
      operation: 'between',
      start: 'start!',
      end: 'end!',
    });

    // -- TYPES --

    // @ts-expect-error params required
    myRange();

    // @ts-expect-error {start,end} required
    myRange({});

    // @ts-expect-error {end} required
    myRange({ start: 'a' });

    // @ts-expect-error {end} required
    myRange({ end: 'z' });
  });

  it('[between operation] should omit any other prop other than _start_ and _end_ if _getValues_ is not present', () => {
    const {
      rangeQueries: { myRange },
    } = getRangeQueriesParams({
      rangeQueries: {
        myRange: { operation: 'between' },
      },
    });

    expect(myRange).toBeDefined();

    const result = myRange({
      start: 'start!',
      end: 'end!',
    });

    expect(result).toEqual({
      operation: 'between',
      start: 'start!',
      end: 'end!',
    });

    // -- TYPES --

    // @ts-expect-error params required
    myRange();

    // @ts-expect-error {start,end} required
    myRange({});

    // @ts-expect-error {end} required
    myRange({ start: 'a' });

    // @ts-expect-error {end} required
    myRange({ end: 'z' });
  });
});
