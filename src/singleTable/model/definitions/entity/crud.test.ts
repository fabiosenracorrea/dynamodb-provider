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

  it('should include type on updates when _includeTypeOnEveryUpdate_ is true', () => {
    const mockUpdateParams = {
      values: { name: 'Jane Doe' },
      includeTypeOnEveryUpdate: true,
    };
    const mockGeneratedValues = {
      ...mockUpdateParams.values,
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
    mockGetKey.mockReturnValue({ partitionKey: 'partition#123', sortKey: 'sort#123' });
    mockGetUpdatedIndexMapping.mockReturnValueOnce({ updateIndex: true });

    const result = getUpdateParams(mockUpdateParams as never);

    expect(result).toEqual({
      partitionKey: 'partition#123',
      sortKey: 'sort#123',
      values: mockGeneratedValues,
      type: 'mockType',
      indexes: { updateIndex: true },
    });
  });

  describe('atomicIndexes handling', () => {
    const mockIndexes = {
      scoreIndex: { index: 'LeaderboardIndex' },
      rankIndex: { index: 'RankIndex' },
    };

    const crudWithIndexes = getCRUDParamGetters(tableConfig, {
      ...crudParamsGenerator,
      indexes: mockIndexes,
    });

    it('should convert entity index names to table index names', () => {
      const mockUpdateParams = {
        values: { name: 'Jane Doe' },
        atomicIndexes: [
          {
            index: 'scoreIndex',
            type: 'add' as const,
            value: 100,
          },
        ],
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#123', sortKey: 'sort#123' });

      const result = crudWithIndexes.getUpdateParams(mockUpdateParams as never);

      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes).toEqual([
        {
          type: 'add',
          value: 100,
          index: 'LeaderboardIndex', // Converted from 'scoreIndex'
        },
      ]);
    });

    it('should handle multiple atomicIndexes', () => {
      const mockUpdateParams = {
        values: { name: 'Alice' },
        atomicIndexes: [
          {
            index: 'scoreIndex',
            type: 'add' as const,
            value: 500,
          },
          {
            index: 'rankIndex',
            type: 'subtract' as const,
            value: 1,
          },
        ],
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#456', sortKey: 'sort#456' });

      const result = crudWithIndexes.getUpdateParams(mockUpdateParams as never);

      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes).toHaveLength(2);
      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes).toContainEqual({
        type: 'add',
        value: 500,
        index: 'LeaderboardIndex',
      });
      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes).toContainEqual({
        type: 'subtract',
        value: 1,
        index: 'RankIndex',
      });
    });

    it('should handle atomicIndexes with conditional operations', () => {
      const mockUpdateParams = {
        values: { name: 'Bob' },
        atomicIndexes: [
          {
            index: 'rankIndex',
            type: 'subtract' as const,
            value: 1,
            if: {
              operation: 'bigger_than' as const,
              value: 0,
            },
          },
        ],
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#789', sortKey: 'sort#789' });

      const result = crudWithIndexes.getUpdateParams(mockUpdateParams as never);

      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes).toEqual([
        {
          type: 'subtract',
          value: 1,
          index: 'RankIndex',
          if: {
            operation: 'bigger_than',
            value: 0,
          },
        },
      ]);
    });

    it('should merge atomicIndexes with regular atomicOperations', () => {
      const mockUpdateParams = {
        values: { name: 'Charlie' },
        atomicOperations: [
          {
            type: 'add' as const,
            property: 'playCount',
            value: 1,
          },
        ],
        atomicIndexes: [
          {
            index: 'scoreIndex',
            type: 'add' as const,
            value: 250,
          },
        ],
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#111', sortKey: 'sort#111' });

      const result = crudWithIndexes.getUpdateParams(mockUpdateParams as never);

      expect(result.atomicOperations).toEqual([
        {
          type: 'add',
          property: 'playCount',
          value: 1,
        },
      ]);
      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes).toEqual([
        {
          type: 'add',
          value: 250,
          index: 'LeaderboardIndex',
        },
      ]);
    });

    it('should preserve all atomic operation properties during conversion', () => {
      const mockUpdateParams = {
        values: { name: 'Frank' },
        atomicIndexes: [
          {
            index: 'scoreIndex',
            type: 'sum' as const,
            value: 1000,
            if: {
              operation: 'exists' as const,
              property: 'score',
            },
          },
        ],
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#444', sortKey: 'sort#444' });

      const result = crudWithIndexes.getUpdateParams(mockUpdateParams as never);

      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(result.atomicIndexes![0]).toEqual({
        type: 'sum',
        value: 1000,
        index: 'LeaderboardIndex',
        if: {
          operation: 'exists',
          property: 'score',
        },
      });
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

    it('update: should handle atomicIndexes in transaction params', () => {
      const mockIndexes = {
        scoreIndex: { index: 'LeaderboardIndex' },
      };

      const crudWithIndexes = getCRUDParamGetters(tableConfig, {
        ...crudParamsGenerator,
        indexes: mockIndexes,
      });

      const mockUpdateParams = {
        values: { name: 'Transaction Test' },
        atomicIndexes: [
          {
            index: 'scoreIndex',
            type: 'add' as const,
            value: 750,
          },
        ],
      };
      const mockGeneratedValues = {
        ...mockUpdateParams.values,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      (addAutoGenParams as jest.Mock).mockReturnValue(mockGeneratedValues);
      mockGetKey.mockReturnValue({ partitionKey: 'partition#999', sortKey: 'sort#999' });

      const transactResult = crudWithIndexes.transactUpdateParams(
        mockUpdateParams as never,
      );

      // @ts-expect-error Testing atomicIndexes which is added at runtime
      expect(transactResult.update.atomicIndexes).toEqual([
        {
          type: 'add',
          value: 750,
          index: 'LeaderboardIndex',
        },
      ]);
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
