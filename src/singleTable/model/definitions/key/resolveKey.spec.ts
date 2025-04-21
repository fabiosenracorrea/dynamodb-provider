/* eslint-disable @typescript-eslint/no-explicit-any */
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

  describe('key ref arrays', () => {
    it('partition: should create the getter if reference is array', () => {
      const result = resolveKeys({
        ...params,
        getPartitionKey: ['HELLO'],
      }) as any;

      expect(typeof result.getPartitionKey).toBe('function');
      expect(result.getPartitionKey()).toEqual(['HELLO']);
      expect(result.getRangeKey).toBe(mockGetRangeKey);
    });

    it('partition: should create the getter if array reference with dotted access', () => {
      const result = resolveKeys({
        ...params,
        getPartitionKey: ['HELLO', '.name'],
      }) as any;

      expect(typeof result.getPartitionKey).toBe('function');
      expect(result.getPartitionKey()).toEqual(['HELLO', undefined]);
      expect(result.getPartitionKey({ name: 'dotted' })).toEqual(['HELLO', 'dotted']);
      expect(result.getRangeKey).toBe(mockGetRangeKey);
    });

    it('range: should create the getter if reference is array', () => {
      const result = resolveKeys({
        ...params,
        getRangeKey: ['HELLO'],
      }) as any;

      expect(typeof result.getRangeKey).toBe('function');
      expect(result.getRangeKey()).toEqual(['HELLO']);
      expect(result.getPartitionKey).toBe(mockGetPartitionKey);
    });

    it('range: should create the getter if array reference with dotted access', () => {
      const result = resolveKeys({
        ...params,
        getRangeKey: ['HELLO', '.name'],
      }) as any;

      expect(typeof result.getRangeKey).toBe('function');
      expect(result.getRangeKey()).toEqual(['HELLO', undefined]);
      expect(result.getRangeKey({ name: 'dotted' })).toEqual(['HELLO', 'dotted']);
      expect(result.getPartitionKey).toBe(mockGetPartitionKey);
    });

    it('key: should create get getKey properly if partition is array', () => {
      const result = resolveKeys({
        ...params,
        getPartitionKey: ['HELLO'],
      }) as any;

      const key = result.getKey({ id: 'IDD' });

      expect(key.partitionKey).toEqual([`HELLO`]);
      expect(key.rangeKey).toEqual(`range-IDD`);
    });

    it('key: should create get getKey properly if partition is dotted array', () => {
      const result = resolveKeys({
        ...params,
        getPartitionKey: ['HELLO', '.name'],
      }) as any;

      const key = result.getKey({ id: 'IDD' });

      expect(key.partitionKey).toEqual(['HELLO', undefined]);
      expect(key.rangeKey).toEqual(`range-IDD`);

      const key2 = result.getKey({ id: 'IDD', name: 'DotMe' });

      expect(key2.partitionKey).toEqual(['HELLO', 'DotMe']);
      expect(key2.rangeKey).toEqual(`range-IDD`);
    });

    it('key: should create get getKey properly if range is array', () => {
      const result = resolveKeys({
        ...params,
        getRangeKey: ['HELLO'],
      }) as any;

      const key = result.getKey({ id: 'IDD' });

      expect(key.rangeKey).toEqual([`HELLO`]);
      expect(key.partitionKey).toEqual(`partition-IDD`);
    });

    it('key: should create get getKey properly if range is dotted array', () => {
      const result = resolveKeys({
        ...params,
        getRangeKey: ['HELLO', '.name'],
      }) as any;

      const key = result.getKey({ id: 'IDD' });

      expect(key.rangeKey).toEqual(['HELLO', undefined]);
      expect(key.partitionKey).toEqual(`partition-IDD`);

      const key2 = result.getKey({ id: 'IDD', name: 'DotMe' });

      expect(key2.rangeKey).toEqual(['HELLO', 'DotMe']);
      expect(key2.partitionKey).toEqual(`partition-IDD`);
    });

    it('key: should create get getKey properly if BOTH are array', () => {
      const result = resolveKeys({
        getPartitionKey: ['PART'],
        getRangeKey: ['HELLO'],
      }) as any;

      const key = result.getKey({ anything: 'yes' });

      expect(key.partitionKey).toEqual(['PART']);
      expect(key.rangeKey).toEqual([`HELLO`]);
    });

    it('key: should create get getKey properly if BOTH are dotted array', () => {
      const result = resolveKeys({
        getPartitionKey: ['PART', '.id'],

        getRangeKey: ['HELLO', '.name'],
      }) as any;

      const key = result.getKey({ id: 'IDD' });

      expect(key.partitionKey).toEqual(['PART', 'IDD']);
      expect(key.rangeKey).toEqual(['HELLO', undefined]);

      const key2 = result.getKey({ id: 'IDD', name: 'DotMe' });

      expect(key.partitionKey).toEqual(['PART', 'IDD']);
      expect(key2.rangeKey).toEqual(['HELLO', 'DotMe']);
    });
  });
});
