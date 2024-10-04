import { resolveKeys } from './resolveKey';

describe('single table model - key resolver', () => {
  const mockGetPartitionKey = jest.fn((params) => `partition-${params.id}`);
  const mockGetRangeKey = jest.fn((params) => `range-${params.id}`);

  const params = {
    getPartitionKey: mockGetPartitionKey,
    getRangeKey: mockGetRangeKey,
  } as {
    getPartitionKey: (p: { id: string }) => string;
    getRangeKey: (p: { id: string }) => string;
  };

  it('should return the getPartitionKey function correctly', () => {
    const result = resolveKeys(params);

    expect(result.getPartitionKey).toBe(mockGetPartitionKey);
  });

  it('should return the getRangeKey function correctly', () => {
    const result = resolveKeys(params);

    expect(result.getRangeKey).toBe(mockGetRangeKey);
  });

  it('should return a getKey function that correctly resolves the keys', () => {
    const result = resolveKeys(params);

    const keyParams = { id: '123' };
    const expectedPartitionKey = `partition-${keyParams.id}`;
    const expectedRangeKey = `range-${keyParams.id}`;

    const keys = result.getKey(keyParams);

    expect(keys.partitionKey).toBe(expectedPartitionKey);
    expect(keys.rangeKey).toBe(expectedRangeKey);

    expect(mockGetPartitionKey).toHaveBeenCalledWith(keyParams);
    expect(mockGetRangeKey).toHaveBeenCalledWith(keyParams);
  });
});
