import { resolveKeySwaps } from './keySwap';

describe('key swaps tests', () => {
  it('should not change key getters if no param match is found', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId }: { someId: string }) => ['HI', someId],

      getPartitionKey: () => ['PARTITION'],
    });

    expect(result.getPartitionKey()).toEqual(['PARTITION']);
    expect(result.getRangeKey({ someId: 'id!' })).toEqual(['HI', 'id!']);

    // @ts-expect-error no unknown props
    expect(result.getKey({ someId: 'id!', other: 'should not be present' })).toEqual({
      partitionKey: ['PARTITION'],
      rangeKey: ['HI', 'id!'],
    });
  });

  it('should swap partition key param (single)', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId }: { someId: string }) => ['HI', someId],

      getPartitionKey: ({ partId }) => ['PARTITION', partId],

      paramMatch: {
        partId: 'matchId',
      },
    });

    expect(result.getPartitionKey({ matchId: 'partSwap!' })).toEqual(['PARTITION', 'partSwap!']);
    expect(result.getRangeKey({ someId: 'id!' })).toEqual(['HI', 'id!']);

    expect(
      // @ts-expect-error we are testing paramMatchers, unknown or match props should be handled
      result.getKey({ someId: 'id!', other: 'should not be present', matchId: 'partSwap!' }),
    ).toEqual({
      partitionKey: ['PARTITION', 'partSwap!'],
      rangeKey: ['HI', 'id!'],
    });
  });

  it('should swap range key param (single)', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId }: { someId: string }) => ['HI', someId],

      getPartitionKey: () => ['PARTITION'],

      paramMatch: {
        someId: 'matchId',
      },
    });

    expect(result.getPartitionKey()).toEqual(['PARTITION']);

    // @ts-expect-error we are testing paramMatchers, unknown or match props should be handled
    expect(result.getRangeKey({ someId: 'id!', matchId: 'matchId!' })).toEqual(['HI', 'matchId!']);

    expect(
      // @ts-expect-error we are testing paramMatchers, unknown or match props should be handled
      result.getKey({ someId: 'id!', matchId: 'matchId!', other: 'should not be present' }),
    ).toEqual({
      partitionKey: ['PARTITION'],
      rangeKey: ['HI', 'matchId!'],
    });
  });

  it('should swap multiple key params', () => {
    const result = resolveKeySwaps({
      getRangeKey: ({ someId, anotherId }: { someId: string; anotherId: string }) => [
        'HI',
        someId,
        anotherId,
      ],

      getPartitionKey: ({
        partId,
        keyId,
        timestamp,
      }: {
        partId: string;
        keyId: string;
        timestamp: string;
      }) => ['PARTITION', partId, keyId, timestamp],

      paramMatch: {
        someId: 'matchId',
        keyId: 'otherKeyId',
        timestamp: 'createdAt',
      },
    });

    expect(
      // @ts-expect-error we are testing paramMatchers
      result.getPartitionKey({ partId: 'partId', otherKeyId: 'otherKey', createdAt: 'some-tz' }),
    ).toEqual(['PARTITION', 'partId', 'otherKey', 'some-tz']);

    expect(
      // @ts-expect-error we are testing paramMatchers
      result.getRangeKey({ someId: 'id!', matchId: 'matchId!', anotherId: 'another1' }),
    ).toEqual(['HI', 'matchId!', 'another1']);

    expect(
      result.getKey({
        someId: 'id!',
        // @ts-expect-error we are testing paramMatchers
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
