import { getRangeQueriesParams } from './range';

describe('single table model - getRangeQueriesParams', () => {
  it('should return an empty object if rangeQueries is undefined', () => {
    const params = {};

    const result = getRangeQueriesParams(params);

    expect(result).toEqual({});
  });

  it('should return an empty object if rangeQueries is not provided', () => {
    const params = { rangeQueries: undefined };

    const result = getRangeQueriesParams(params);

    expect(result).toEqual({});
  });

  it('should return correct range query functions for basic range configuration', () => {
    const basicRangeConfig = {
      operation: 'eq',
      getValues: jest.fn((id: string) => ({ value: id })),
    };

    const params = {
      rangeQueries: {
        queryById: basicRangeConfig,
      },
    };

    const result = getRangeQueriesParams(params);

    expect(result.rangeQueries).toHaveProperty('queryById');
    const { queryById } = result.rangeQueries;
    const valueParams = 'test-id';
    const expectedResult = { operation: 'eq', value: 'test-id' };

    expect(queryById(valueParams)).toEqual(expectedResult);
    expect(basicRangeConfig.getValues).toHaveBeenCalledWith(valueParams);
  });

  it('should return correct range query functions for between range configuration', () => {
    const betweenRangeConfig = {
      operation: 'between',
      getValues: jest.fn((id: string) => ({ start: `${id}-start`, end: `${id}-end` })),
    };

    const params = {
      rangeQueries: {
        queryBetween: betweenRangeConfig,
      },
    };

    const result = getRangeQueriesParams(params);

    expect(result.rangeQueries).toHaveProperty('queryBetween');
    const { queryBetween } = result.rangeQueries;
    const valueParams = 'test-id';
    const expectedResult = { operation: 'between', start: 'test-id-start', end: 'test-id-end' };

    expect(queryBetween(valueParams)).toEqual(expectedResult);
    expect(betweenRangeConfig.getValues).toHaveBeenCalledWith(valueParams);
  });

  it('should handle multiple range queries configurations', () => {
    const basicRangeConfig = {
      operation: 'eq',
      getValues: jest.fn((id: string) => ({ value: id })),
    };

    const betweenRangeConfig = {
      operation: 'between',
      getValues: jest.fn((id: string) => ({ start: `${id}-start`, end: `${id}-end` })),
    };

    const params = {
      rangeQueries: {
        queryById: basicRangeConfig,
        queryBetween: betweenRangeConfig,
      },
    };

    const result = getRangeQueriesParams(params);

    const { queryById } = result.rangeQueries;
    const valueParamsById = 'test-id';
    const expectedResultById = { operation: 'eq', value: 'test-id' };

    expect(queryById(valueParamsById)).toEqual(expectedResultById);
    expect(basicRangeConfig.getValues).toHaveBeenCalledWith(valueParamsById);

    const { queryBetween } = result.rangeQueries;
    const valueParamsBetween = 'test-id';
    const expectedResultBetween = {
      operation: 'between',
      start: 'test-id-start',
      end: 'test-id-end',
    };

    expect(queryBetween(valueParamsBetween)).toEqual(expectedResultBetween);
    expect(betweenRangeConfig.getValues).toHaveBeenCalledWith(valueParamsBetween);
  });
});
