import { getCRUDParamGetters } from './crud';
import { addAutoGenParams } from './autoGen';

jest.mock('./autoGen', () => ({
  addAutoGenParams: jest.fn(),
}));

describe('getCRUDParamGetters', () => {
  const mockGetKey = jest.fn();
  const mockGetCreationIndexMapping = jest.fn().mockReturnValue({ createIndex: true });
  const mockGetUpdatedIndexMapping = jest.fn().mockReturnValue({ updateIndex: true });

  const mockAutoGen = {
    onCreate: { createdAt: 'timestamp' },
    onUpdate: { updatedAt: 'timestamp' },
  };

  const tableConfig = {
    table: 'some',

    partitionKey: 'some',

    rangeKey: 'some',

    typeIndex: {
      partitionKey: 'partitionKey-TYPE',

      rangeKey: 'rangeKey-TYPE',

      name: 'INDEX_TYPE',
    },

    expiresAt: 'YES',
  };

  const type = 'mockType';

  const crudParamsGenerator = {
    type,
    getKey: mockGetKey,
    getCreationIndexMapping: mockGetCreationIndexMapping,
    getUpdatedIndexMapping: mockGetUpdatedIndexMapping,
    autoGen: mockAutoGen,
  };

  const { getCreationParams, getUpdateParams } = getCRUDParamGetters(
    tableConfig,
    crudParamsGenerator,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should correctly generate creation params', () => {
    const mockItem = { id: '123', name: 'John Doe' };
    const mockConfig = { expiresAt: 203294320 };
    const mockGeneratedItem = { ...mockItem, createdAt: '2024-01-01T00:00:00.000Z' };

    (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedItem);
    mockGetKey.mockReturnValue({ partitionKey: 'partition#123', sortKey: 'sort#123' });

    const result = getCreationParams(mockItem, mockConfig);

    expect(addAutoGenParams).toHaveBeenCalledWith(mockItem, mockAutoGen.onCreate);
    expect(mockGetKey).toHaveBeenCalledWith({ ...mockItem, ...mockGeneratedItem });
    expect(result).toEqual({
      ...mockConfig,
      key: { partitionKey: 'partition#123', sortKey: 'sort#123' },
      type: 'mockType',
      item: mockGeneratedItem,
      indexes: { createIndex: true },
    });
  });

  it('should correctly generate update params', () => {
    const mockUpdateParams = {
      values: { name: 'Jane Doe' },
      atomicOperations: [],
      conditions: [],
      remove: [],
      returnUpdatedProperties: true,
    };
    const mockGeneratedValues = {
      ...mockUpdateParams.values,
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
    mockGetKey.mockReturnValue({ partitionKey: 'partition#123', sortKey: 'sort#123' });

    const result = getUpdateParams(mockUpdateParams);

    mockGetUpdatedIndexMapping.mockReturnValue({ index: true });

    expect(addAutoGenParams).toHaveBeenCalledWith(mockUpdateParams.values, mockAutoGen.onUpdate);
    expect(mockGetKey).toHaveBeenCalledWith(mockUpdateParams);
    expect(result).toEqual({
      ...mockUpdateParams,
      partitionKey: 'partition#123',
      sortKey: 'sort#123',
      values: mockGeneratedValues,
      indexes: { updateIndex: true },
    });
  });
});
