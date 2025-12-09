/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, OrString, StringKey } from 'types';
import { resolveKeys } from './resolveKey';

type EntityRef = {
  id: string;
  partId: string;
  rangeId: string;
  name: string;
};

/**
 * Type helper to resolve properly the .prop
 * references
 */
function getArrayKey<T extends readonly OrString<StringKey<EntityRef>>[]>(t: T) {
  return t;
}

describe('single table model - key resolver', () => {
  const mockGetPartitionKey = jest.fn((params) => `partition-${params.partId}`);
  const mockGetRangeKey = jest.fn((params) => `range-${params.rangeId}`);

  const params = {
    getPartitionKey: mockGetPartitionKey,
    getRangeKey: mockGetRangeKey,
  } as {
    getPartitionKey: (p: { partId: string }) => string;
    getRangeKey: (p: { rangeId: string }) => string;
  };

  it('should return the getPartitionKey function correctly', () => {
    const { getPartitionKey } = resolveKeys<EntityRef, typeof params>(params);

    expect(getPartitionKey).toBe(mockGetPartitionKey);

    type Params = Parameters<typeof getPartitionKey>[0];

    type _R = Expect<Equal<Params, { partId: string }>>;
  });

  it('should return the getRangeKey function correctly', () => {
    const { getRangeKey } = resolveKeys<EntityRef, typeof params>(params);

    expect(getRangeKey).toBe(mockGetRangeKey);

    type Params = Parameters<typeof getRangeKey>[0];

    type _R = Expect<Equal<Params, { rangeId: string }>>;
  });

  it('should return a getKey function that correctly resolves the keys', () => {
    const { getKey } = resolveKeys<EntityRef, typeof params>(params);

    const keyParams = { partId: 'part', rangeId: 'range' };

    const keys = getKey(keyParams);

    expect(keys).toEqual({
      partitionKey: 'partition-part',
      rangeKey: 'range-range',
    });

    expect(mockGetPartitionKey).toHaveBeenCalledWith(keyParams);
    expect(mockGetRangeKey).toHaveBeenCalledWith(keyParams);

    type Params = Parameters<typeof getKey>[0];

    type _R = Expect<Equal<Params, { rangeId: string; partId: string }>>;
  });

  it('[TYPES] should not accept getPartitionKey params not present on entity', () => {
    const newParams = {
      ...params,
      getPartitionKey: (_p: { __badKey: string }) => 'Hello!',
    };

    // @ts-expect-error __badKey is not inside EntityRef!
    resolveKeys<EntityRef, typeof newParams>(newParams);
  });

  it('[TYPES] should not accept getRangeKey params not present on entity', () => {
    const newParams = {
      ...params,
      getRangeKey: (_p: { __badKey: string }) => 'Hello!',
    };

    // @ts-expect-error __badKey is not inside EntityRef!
    resolveKeys<EntityRef, typeof newParams>(newParams);
  });

  it('[TYPES] should not accept both getters params not present on entity', () => {
    const newParams = {
      getPartitionKey: (_p: { __otherBad: string }) => 'Hello!',
      getRangeKey: (_p: { __badKey: string }) => 'Hello!',
    };

    // @ts-expect-error __badKey is not inside EntityRef!
    resolveKeys<EntityRef, typeof newParams>(newParams);
  });

  describe('key ref arrays', () => {
    it('partition: should create the getter if reference is array', () => {
      const newParams = { ...params, getPartitionKey: ['HELLO'] };

      const { getPartitionKey, getRangeKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      expect(typeof getPartitionKey).toBe('function');
      expect(getPartitionKey()).toEqual(['HELLO']);
      expect(getRangeKey).toBe(mockGetRangeKey);

      type Params = Parameters<typeof getPartitionKey>;

      type _R = Expect<Equal<Params, []>>;
    });

    it('partition: should create the getter if array reference with dotted access', () => {
      const newParams = { ...params, getPartitionKey: getArrayKey(['HELLO', '.name']) };

      const { getPartitionKey, getRangeKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      expect(typeof getPartitionKey).toBe('function');

      // @ts-expect-error name is required
      expect(getPartitionKey()).toEqual(['HELLO', undefined]);

      expect(getPartitionKey({ name: 'dotted' })).toEqual(['HELLO', 'dotted']);

      expect(getRangeKey).toBe(mockGetRangeKey);

      type Params = Parameters<typeof getPartitionKey>[0];

      type _R = Expect<Equal<Params, { name: string }>>;
    });

    it('range: should create the getter if reference is array', () => {
      const newParams = { ...params, getRangeKey: ['HELLO'] };

      const { getRangeKey, getPartitionKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      expect(typeof getRangeKey).toBe('function');
      expect(getRangeKey()).toEqual(['HELLO']);
      expect(getPartitionKey).toBe(mockGetPartitionKey);

      type Params = Parameters<typeof getRangeKey>;

      type _R = Expect<Equal<Params, []>>;
    });

    it('range: should create the getter if array reference with dotted access', () => {
      const newParams = { ...params, getRangeKey: getArrayKey(['HELLO', '.name']) };

      const { getRangeKey, getKey, getPartitionKey } = resolveKeys<EntityRef, typeof newParams>(
        newParams,
      );

      expect(typeof getRangeKey).toBe('function');

      // @ts-expect-error param is required
      expect(getRangeKey()).toEqual(['HELLO', undefined]);

      expect(getRangeKey({ name: 'dotted' })).toEqual(['HELLO', 'dotted']);

      expect(getPartitionKey).toBe(mockGetPartitionKey);

      type Params = Parameters<typeof getRangeKey>[0];

      type _R = Expect<Equal<Params, { name: string }>>;

      type KeyParams = Parameters<typeof getKey>[0];

      type _K = Expect<Equal<KeyParams, { name: string; partId: string }>>;
    });

    it('key: should create get getKey properly if partition is array', () => {
      const newParams = { ...params, getPartitionKey: ['HELLO'] };

      const { getKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      const key = getKey({ rangeId: 'IDD' });

      expect(key.partitionKey).toEqual([`HELLO`]);
      expect(key.rangeKey).toEqual(`range-IDD`);

      type KeyParams = Parameters<typeof getKey>[0];

      type _K = Expect<Equal<KeyParams, { rangeId: string }>>;
    });

    it('key: should create get getKey properly if partition is dotted array', () => {
      const newParams = { ...params, getPartitionKey: getArrayKey(['HELLO', '.name']) };

      const { getKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      // @ts-expect-error missing name, yes
      const key = getKey({ rangeId: 'IDD' });

      expect(key.partitionKey).toEqual(['HELLO', undefined]);
      expect(key.rangeKey).toEqual(`range-IDD`);

      const key2 = getKey({ rangeId: 'IDD', name: 'DotMe' });

      expect(key2.partitionKey).toEqual(['HELLO', 'DotMe']);
      expect(key2.rangeKey).toEqual(`range-IDD`);

      type KeyParams = Parameters<typeof getKey>[0];

      type _K = Expect<Equal<KeyParams, { rangeId: string; name: string }>>;
    });

    it('key: should create get getKey properly if range is array', () => {
      const newParams = { ...params, getRangeKey: ['HELLO'] };

      const { getKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      const key = getKey({ partId: 'IDD' });

      expect(key.rangeKey).toEqual([`HELLO`]);
      expect(key.partitionKey).toEqual(`partition-IDD`);

      type KeyParams = Parameters<typeof getKey>[0];

      type _K = Expect<Equal<KeyParams, { partId: string }>>;
    });

    it('key: should create get getKey properly if range is dotted array', () => {
      const newParams = { ...params, getRangeKey: getArrayKey(['HELLO', '.name']) };

      const { getKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      // @ts-expect-error missing name, yes
      const key = getKey({ partId: 'IDD' });

      expect(key.partitionKey).toEqual('partition-IDD');
      expect(key.rangeKey).toEqual(['HELLO', undefined]);

      const key2 = getKey({ partId: 'IDD', name: 'DotMe' });

      expect(key2.partitionKey).toEqual('partition-IDD');
      expect(key2.rangeKey).toEqual(['HELLO', 'DotMe']);

      type KeyParams = Parameters<typeof getKey>[0];

      type _K = Expect<Equal<KeyParams, { partId: string; name: string }>>;
    });

    it('key: should create get getKey properly if BOTH are array', () => {
      const newParams = {
        getPartitionKey: ['PART'],
        getRangeKey: ['HELLO'],
      };

      const { getKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      // @ts-expect-error no params!
      const key = getKey({ anything: 'yes' });

      expect(key.partitionKey).toEqual(['PART']);
      expect(key.rangeKey).toEqual([`HELLO`]);

      type KeyParams = Parameters<typeof getKey>;

      type _K = Expect<Equal<KeyParams, []>>;
    });

    it('key: should create get getKey properly if BOTH are dotted array', () => {
      const newParams = {
        getPartitionKey: getArrayKey(['PART', '.id']),
        getRangeKey: getArrayKey(['HELLO', '.name']),
      };

      const { getKey } = resolveKeys<EntityRef, typeof newParams>(newParams);

      // @ts-expect-error missing name
      const keyId = getKey({ id: 'IDD' });

      expect(keyId.partitionKey).toEqual(['PART', 'IDD']);
      expect(keyId.rangeKey).toEqual(['HELLO', undefined]);

      // @ts-expect-error missing id
      const keyName = getKey({ name: 'name' });

      expect(keyName.partitionKey).toEqual(['PART', undefined]);
      expect(keyName.rangeKey).toEqual(['HELLO', 'name']);

      const keyFull = getKey({ id: 'IDD', name: 'DotMe' });

      expect(keyFull.partitionKey).toEqual(['PART', 'IDD']);
      expect(keyFull.rangeKey).toEqual(['HELLO', 'DotMe']);

      type KeyParams = Parameters<typeof getKey>[0];

      type _K = Expect<Equal<KeyParams, { id: string; name: string }>>;
    });
  });
});
