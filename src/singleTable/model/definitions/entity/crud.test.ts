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
    onCreate: { createdAt: 'timestamp' as const },
    onUpdate: { updatedAt: 'timestamp' as const },
  };

  const tableConfig = {
    table: 'some',

    partitionKey: 'some',

    rangeKey: 'other-some',

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
    getPartitionKey: jest.fn(),
    getRangeKey: jest.fn(),
    getCreationIndexMapping: mockGetCreationIndexMapping,
    getUpdatedIndexMapping: mockGetUpdatedIndexMapping,
    autoGen: mockAutoGen,
  };

  const { getCreationParams, getUpdateParams, getValidationParams, ...transactParams } =
    getCRUDParamGetters(tableConfig, crudParamsGenerator);

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

    expect(addAutoGenParams).toHaveBeenCalledWith({
      values: mockItem,
      genConfig: mockAutoGen.onCreate,
      tableConfig,
    });
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

    const result = getUpdateParams(mockUpdateParams as never);

    mockGetUpdatedIndexMapping.mockReturnValue({ index: true });

    expect(addAutoGenParams).toHaveBeenCalledWith({
      values: mockUpdateParams.values ?? {},
      genConfig: mockAutoGen.onUpdate,
      tableConfig,
    });
    expect(mockGetKey).toHaveBeenCalledWith(mockUpdateParams);
    expect(result).toEqual({
      ...mockUpdateParams,
      partitionKey: 'partition#123',
      sortKey: 'sort#123',
      values: mockGeneratedValues,
      indexes: { updateIndex: true },
    });
  });

  describe('transaction param generation', () => {
    it('create: should generate params with getCreationParams', () => {
      const mockItem = { id: '123', name: 'John Doe' };
      const mockConfig = { expiresAt: 203294320 };
      const mockGeneratedItem = { ...mockItem, createdAt: '2024-01-01T00:00:00.000Z' };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedItem);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#123', sortKey: 'sort#123' });

      const creationParamResult = getCreationParams(mockItem, mockConfig);

      const transactResult = transactParams.transactCreateParams(mockItem, mockConfig);

      expect(transactResult).toStrictEqual({
        create: creationParamResult,
      });
    });

    it('update: should generate params with getUpdateParams', () => {
      const mockUpdateParams = {
        values: { name: 'Jane Doe' },
        atomicOperations: [
          {
            operation: 'add',
            property: 'count',
            value: 1,
          },
        ],
        conditions: [],
        remove: ['prop'],
        returnUpdatedProperties: true,
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#123', sortKey: 'sort#123' });

      const updateParamsResult = getUpdateParams(mockUpdateParams as never);

      const transactResult = transactParams.transactUpdateParams(
        mockUpdateParams as never,
      );

      expect(transactResult).toStrictEqual({
        update: updateParamsResult,
      });
    });

    it('delete: should generate params with getKey + forward conditions', () => {
      mockGetKey.mockReturnValueOnce({
        partitionKey: 'hi',
        rangeKey: 'hello',
      });

      const conditions = Symbol('conditions');

      const params = transactParams.transactDeleteParams({
        conditions,
      } as never);

      expect(params).toStrictEqual({
        erase: {
          conditions,
          partitionKey: 'hi',
          rangeKey: 'hello',
        },
      });
    });

    it('validate: should generate params with getValidationParams', () => {
      mockGetKey.mockReturnValueOnce({
        partitionKey: 'hi-validate',
        rangeKey: 'another',
      });

      const conditions = Symbol('validate-conditions');

      const payload = {
        conditions,
      };

      const params = getValidationParams(payload as never);

      mockGetKey.mockReturnValueOnce({
        partitionKey: 'hi-validate',
        rangeKey: 'another',
      });

      const transactResult = transactParams.transactValidateParams(payload as never);

      expect(transactResult).toStrictEqual({
        validate: params,
      });
    });

    it('getValidationParams: should generate params with getKey + forward conditions', () => {
      mockGetKey.mockReturnValueOnce({
        partitionKey: 'hi-validate',
        rangeKey: 'another',
      });

      const conditions = Symbol('validate-conditions');

      const params = getValidationParams({
        conditions,
      } as never);

      expect(params).toStrictEqual({
        conditions,
        partitionKey: 'hi-validate',
        rangeKey: 'another',
      });
    });
  });
});
