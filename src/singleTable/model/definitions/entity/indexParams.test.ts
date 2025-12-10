import { Equal, Expect } from 'types';
import { getEntityIndexParams } from './indexParams';
import { resolveKeys } from '../key';
import { getRangeQueriesParams } from '../range';

jest.mock('../key', () => ({
  resolveKeys: jest.fn(),
}));

jest.mock('../range', () => ({
  getRangeQueriesParams: jest.fn(),
}));

const tableConfig = {
  partitionKey: 'r1',
  rangeKey: 'h1',
  table: '11',
  indexes: {
    index1: {
      partitionKey: 'ir1',
      rangeKey: 'ih1',
    },
    index2: {
      partitionKey: 'ir2',
      rangeKey: 'ih2',
    },
  },
};

type TableConfig = typeof tableConfig;

describe('single table entity model: getEntityIndexParams', () => {
  const mockResolveKeys = resolveKeys as jest.Mock;
  const mockGetRangeQueriesParams = getRangeQueriesParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should return an empty object if indexes are not properly configured', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getEntityIndexParams({} as any, {} as any);

    expect(result).toEqual({});
  });

  it('should correctly generate indexes when indexes are provided', () => {
    const params = {
      type: 'SOME',
      indexes: {
        index1: {
          getPartitionKey: () => ['SOME_KEY'],
          getRangeKey: () => ['SOME_KEY'],
          index: 'index1' as const,
        },
        index2: {
          getPartitionKey: () => ['SOME_KEY'],
          getRangeKey: () => ['SOME_KEY'],
          index: 'index2' as const,
        },
      },
    };

    const getKey = jest.fn();

    mockResolveKeys.mockReturnValue({
      getKey,
    });

    const result = getEntityIndexParams<TableConfig, typeof params>(tableConfig, params);

    expect(result.indexes).toEqual({
      index1: {
        ...params.indexes.index1,
        getKey,
      },
      index2: {
        ...params.indexes.index2,
        getKey,
      },
    });

    expect(mockResolveKeys).toHaveBeenCalledWith(params.indexes.index1);
    expect(mockResolveKeys).toHaveBeenCalledWith(params.indexes.index2);
    expect(mockGetRangeQueriesParams).toHaveBeenCalledWith(params.indexes.index1);
    expect(mockGetRangeQueriesParams).toHaveBeenCalledWith(params.indexes.index2);
  });

  it('should parse rangeQueries if present', () => {
    const params = {
      type: 'SOME',
      indexes: {
        index1: {
          getPartitionKey: () => ['SOME_KEY'],
          getRangeKey: () => ['SOME_KEY'],
          index: 'index1' as const,

          rangeQueries: {
            myRangeDefaults: {
              operation: 'begins_with' as const,
            },

            myRangeParams: {
              operation: 'equal' as const,
              getValues: ({ prefix }: { prefix: string }) => ({ value: prefix }),
            },
          },
        },
      },
    };

    const {
      indexes: {
        index1: {
          rangeQueries: { myRangeDefaults, myRangeParams },
        },
      },
    } = getEntityIndexParams<TableConfig, typeof params>(tableConfig, params);

    expect(myRangeDefaults).toBeDefined();
    expect(myRangeParams).toBeDefined();

    type DefaultParams = Parameters<typeof myRangeDefaults>[0];

    type _Defaults = Expect<Equal<keyof DefaultParams, 'value'>>;

    type CustomParams = Parameters<typeof myRangeParams>[0];

    type _Custom1 = Expect<Equal<keyof CustomParams, 'prefix'>>;
    type _Custom2 = Expect<Equal<CustomParams, { prefix: string }>>;
  });

  it('should *throw* if duplicate index reference is present', () => {
    const params = {
      type: 'entity',
      indexes: {
        someName: {
          getPartitionKey: () => ['KEY'],
          getRangeKey: () => ['KEY'],
          index: 'index1' as const,
        },
        otherName: {
          getPartitionKey: () => ['KEY'],
          getRangeKey: () => ['KEY'],
          index: 'index1' as const,
        },
      },
    };

    const executor = () => {
      getEntityIndexParams<TableConfig, typeof params>(tableConfig, params);
    };

    expect(executor).toThrow();
  });

  describe('getCreationIndexMapping', () => {
    it('handles full index mapping generation', () => {
      const mockPartitionKey = 'mocked-partition-key';
      const mockRangeKey = 'mocked-range-key';

      const params = {
        type: 'entity',
        indexes: {
          index1: {
            getPartitionKey: jest.fn().mockReturnValue(mockPartitionKey),
            getRangeKey: jest.fn().mockReturnValue(mockRangeKey),
            index: 'index1' as const,
          },
        },
      };
      const mockIndexParams = {
        someParam: 'value',
        other: true,
        another: 'yes',
        anything: Symbol('here'),
      };

      const result = getEntityIndexParams<TableConfig, typeof params>(
        tableConfig,
        params,
      );

      const creationMapping = result.getCreationIndexMapping(mockIndexParams);

      expect(creationMapping).toEqual({
        index1: {
          partitionKey: mockPartitionKey,
          rangeKey: mockRangeKey,
        },
      });

      expect(params.indexes.index1.getPartitionKey).toHaveBeenCalledWith(mockIndexParams);
      expect(params.indexes.index1.getRangeKey).toHaveBeenCalledWith(mockIndexParams);
    });

    it('handles one invalid key returned', () => {
      const partitionKey = 'mocked-partition-key';
      const invalidRangeKey = ['mocked-range-key', null];

      const params = {
        type: 'entity',
        indexes: {
          index1: {
            getPartitionKey: () => partitionKey,
            getRangeKey: () => invalidRangeKey,
            index: 'index1' as const,
          },
        },
      };
      const mockIndexParams = { someParam: 'value' };

      const result = getEntityIndexParams<TableConfig, typeof params>(
        tableConfig,
        params,
      );

      const creationMapping = result.getCreationIndexMapping(mockIndexParams);

      expect(creationMapping).toEqual({
        index1: {
          partitionKey,
        },
      });
    });

    it('handles both invalid keys', () => {
      const params = {
        type: 'entity',
        indexes: {
          index1: {
            getPartitionKey: () => ['Invalid', null],
            getRangeKey: () => ['SOME', null],
            index: 'index1' as const,
          },
          index2: {
            getPartitionKey: () => 'OK',
            getRangeKey: () => ['SOME_INVALID_AGAIN', null],
            index: 'index2' as const,
          },
        },
      };

      const result = getEntityIndexParams<TableConfig, typeof params>(
        tableConfig,
        params,
      );

      const creationMapping = result.getCreationIndexMapping({ someParam: 'value' });

      expect(creationMapping).toEqual({
        index2: {
          partitionKey: 'OK',
        },
      });
    });
  });

  describe('getUpdatedIndexMapping', () => {
    it('should correctly handle updated index mapping', () => {
      const mockPartitionKey = 'mocked-partition-key-2';
      const mockRangeKey = 'mocked-range-key-2';

      const params = {
        type: 'SOME',
        indexes: {
          index2: {
            getPartitionKey: jest.fn().mockReturnValue(mockPartitionKey),
            getRangeKey: jest.fn().mockReturnValue(mockRangeKey),
            index: 'index2' as const,
          },
        },
      };

      const { getUpdatedIndexMapping } = getEntityIndexParams<TableConfig, typeof params>(
        tableConfig,
        params,
      );

      const updatedMapping = getUpdatedIndexMapping({ someParam: 'value' });

      expect(updatedMapping).toEqual({
        index2: {
          partitionKey: mockPartitionKey,
          rangeKey: mockRangeKey,
        },
      });
    });

    it('should correctly handle index update if one invalid key is returned', () => {
      const mockPartitionKey = ['mocked-partition-key-2', null];
      const mockRangeKey = 'mocked-range-key-2';

      const params = {
        type: 'SOME',
        indexes: {
          index2: {
            getPartitionKey: jest.fn().mockReturnValue(mockPartitionKey),
            getRangeKey: jest.fn().mockReturnValue(mockRangeKey),
            index: 'index2' as const,
          },
        },
      };

      const { getUpdatedIndexMapping } = getEntityIndexParams<TableConfig, typeof params>(
        tableConfig,
        params,
      );

      const updatedMapping = getUpdatedIndexMapping({ someParam: 'value' });

      expect(updatedMapping).toEqual({
        index2: {
          rangeKey: mockRangeKey,
        },
      });
    });

    it('should correctly handle index update if both invalid keys are returned', () => {
      const mockPartitionKey = ['mocked-partition-key-2', null];
      const mockRangeKey = ['mocked-range-key-2', null];

      const params = {
        type: 'SOME',
        indexes: {
          index2: {
            getPartitionKey: jest.fn().mockReturnValue(mockPartitionKey),
            getRangeKey: jest.fn().mockReturnValue(mockRangeKey),
            index: 'index2' as const,
          },
        },
      };

      const { getUpdatedIndexMapping } = getEntityIndexParams<TableConfig, typeof params>(
        tableConfig,
        params,
      );

      const updatedMapping = getUpdatedIndexMapping({ someParam: 'value' });

      expect(updatedMapping).toEqual({});
    });
  });
});
