import { getEntityIndexParams } from './indexParams';
import { resolveKeys } from '../key';
import { getRangeQueriesParams } from '../range';

jest.mock('../key', () => ({
  resolveKeys: jest.fn(),
}));

jest.mock('../range', () => ({
  getRangeQueriesParams: jest.fn(),
}));

describe('single table entity model: getEntityIndexParams', () => {
  const mockResolveKeys = resolveKeys as jest.Mock;
  const mockGetRangeQueriesParams = getRangeQueriesParams as jest.Mock;

  const mockTableConfig = {
    indexes: {
      index1: {},
      index2: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should return an empty object if indexes are not properly configured', () => {
    const result = getEntityIndexParams({}, {});

    expect(result).toEqual({});
  });

  it('should correctly generate indexes when indexes are provided', () => {
    const params = {
      indexes: {
        index1: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index1',
        },
        index2: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index2',
        },
      },
    };
    const getKey = jest.fn();

    mockResolveKeys.mockReturnValue({
      getKey,
    });

    const result = getEntityIndexParams(mockTableConfig, params);

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

  it('should correctly handle creation index mapping', () => {
    const params = {
      indexes: {
        index1: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index1',
        },
        index2: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index2',
        },
      },
    };
    const mockIndexParams = { someParam: 'value' };

    const mockPartitionKey = 'mocked-partition-key';
    const mockRangeKey = 'mocked-range-key';

    params.indexes.index1.getPartitionKey.mockReturnValue(mockPartitionKey);
    params.indexes.index1.getRangeKey.mockReturnValue(mockRangeKey);

    const result = getEntityIndexParams(mockTableConfig, params);
    const creationMapping = result.getCreationIndexMapping(mockIndexParams);

    expect(creationMapping).toEqual({
      index1: {
        partitionKey: mockPartitionKey,
        rangeKey: mockRangeKey,
      },
    });

    params.indexes.index1.getPartitionKey.mockClear();
    params.indexes.index1.getRangeKey.mockClear();
  });

  it('should correctly handle index creation if one invalid key is returned', () => {
    const params = {
      indexes: {
        index1: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index1',
        },
        index2: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index2',
        },
      },
    };
    const mockIndexParams = { someParam: 'value' };

    const mockPartitionKey = 'mocked-partition-key';
    const mockRangeKey = ['mocked-range-key', null];

    params.indexes.index1.getPartitionKey.mockReturnValue(mockPartitionKey);
    params.indexes.index1.getRangeKey.mockReturnValue(mockRangeKey);

    const result = getEntityIndexParams(mockTableConfig, params);
    const creationMapping = result.getCreationIndexMapping(mockIndexParams);

    expect(creationMapping).toEqual({
      index1: {
        partitionKey: mockPartitionKey,
      },
    });

    params.indexes.index1.getPartitionKey.mockClear();
    params.indexes.index1.getRangeKey.mockClear();
  });

  it('should correctly handle updated index mapping', () => {
    const params = {
      indexes: {
        index1: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index1',
        },
        index2: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index2',
        },
      },
    };
    const mockIndexParams = { someParam: 'value' };

    const mockPartitionKey = 'mocked-partition-key-2';
    const mockRangeKey = 'mocked-range-key-2';

    params.indexes.index2.getPartitionKey.mockReturnValue(mockPartitionKey);
    params.indexes.index2.getRangeKey.mockReturnValue(mockRangeKey);

    const result = getEntityIndexParams(mockTableConfig, params);
    const updatedMapping = result.getUpdatedIndexMapping(mockIndexParams);

    expect(updatedMapping).toEqual({
      index2: {
        partitionKey: mockPartitionKey,
        rangeKey: mockRangeKey,
      },
    });

    params.indexes.index2.getPartitionKey.mockClear();
    params.indexes.index2.getRangeKey.mockClear();
  });

  it('should correctly handle index update if one invalid key is returned', () => {
    const params = {
      indexes: {
        index1: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index1',
        },
        index2: {
          getPartitionKey: jest.fn(),
          getRangeKey: jest.fn(),
          index: 'index2',
        },
      },
    };
    const mockIndexParams = { someParam: 'value' };

    const mockPartitionKey = ['mocked-range-key', null];
    const mockRangeKey = 'mocked-partition-key';

    params.indexes.index1.getPartitionKey.mockReturnValue(mockPartitionKey);
    params.indexes.index1.getRangeKey.mockReturnValue(mockRangeKey);

    const result = getEntityIndexParams(mockTableConfig, params);
    const creationMapping = result.getUpdatedIndexMapping(mockIndexParams);

    expect(creationMapping).toEqual({
      index1: {
        rangeKey: mockRangeKey,
      },
    });

    params.indexes.index1.getPartitionKey.mockClear();
    params.indexes.index1.getRangeKey.mockClear();
  });
});
