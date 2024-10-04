import { resolveKeySwaps, FullPartitionKeys } from './keySwap';

describe('key swaps tests', () => {
  it('should not change key getters if no param match is found', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId }) => ['HI', someId],

      getPartitionKey: () => ['PARTITION'],
    }) as FullPartitionKeys<any, any, any>;

    result.getKey({});

    expect(result.getPartitionKey()).toEqual(['PARTITION']);
    expect(result.getRangeKey({ someId: 'id!' })).toEqual(['HI', 'id!']);
    expect(result.getKey({ someId: 'id!', other: 'should not be present' })).toEqual({
      partitionKey: ['PARTITION'],
      rangeKey: ['HI', 'id!'],
    });
  });

  it('should swap partition key param (single)', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId }) => ['HI', someId],

      getPartitionKey: ({ partId }) => ['PARTITION', partId],

      paramMatch: {
        partId: 'matchId',
      },
    });

    expect(result.getPartitionKey({ matchId: 'partSwap!' })).toEqual(['PARTITION', 'partSwap!']);
    expect(result.getRangeKey({ someId: 'id!' })).toEqual(['HI', 'id!']);

    expect(
      result.getKey({ someId: 'id!', other: 'should not be present', matchId: 'partSwap!' }),
    ).toEqual({
      partitionKey: ['PARTITION', 'partSwap!'],
      rangeKey: ['HI', 'id!'],
    });
  });

  it('should swap range key param (single)', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId }) => ['HI', someId],

      getPartitionKey: () => ['PARTITION'],

      paramMatch: {
        someId: 'matchId',
      },
    });

    expect(result.getPartitionKey()).toEqual(['PARTITION']);
    expect(result.getRangeKey({ someId: 'id!', matchId: 'matchId!' })).toEqual(['HI', 'matchId!']);

    expect(
      result.getKey({ someId: 'id!', matchId: 'matchId!', other: 'should not be present' }),
    ).toEqual({
      partitionKey: ['PARTITION'],
      rangeKey: ['HI', 'matchId!'],
    });
  });

  it('should swap multiple key params', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId, anotherId }) => ['HI', someId, anotherId],

      getPartitionKey: ({ partId, keyId, timestamp }) => ['PARTITION', partId, keyId, timestamp],

      paramMatch: {
        someId: 'matchId',
        keyId: 'otherKeyId',
        timestamp: 'createdAt',
      },
    });

    expect(
      result.getPartitionKey({ partId: 'partId', otherKeyId: 'otherKey', createdAt: 'some-tz' }),
    ).toEqual(['PARTITION', 'partId', 'otherKey', 'some-tz']);

    expect(
      result.getRangeKey({ someId: 'id!', matchId: 'matchId!', anotherId: 'another1' }),
    ).toEqual(['HI', 'matchId!', 'another1']);

    expect(
      result.getKey({
        someId: 'id!',
        matchId: 'matchId!',
        anotherId: 'another1',
        other: 'should not be present',
        partId: 'partId',
        otherKeyId: 'otherKey',
        createdAt: 'some-tz',
      }),
    ).toEqual({
      partitionKey: ['PARTITION', 'partId', 'otherKey', 'some-tz'],
      rangeKey: ['HI', 'matchId!', 'another1'],
    });
  });
});
