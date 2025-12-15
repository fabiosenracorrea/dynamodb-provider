import { Equal, Expect } from 'types';
import { resolveKeySwaps } from './keySwap';

interface EntityReference {
  matchId: string;
  partId: string;
  otherKeyId: string;
  createdAt: string;
  anotherId: string;
}

describe('key swaps tests', () => {
  it('should not change key getters if no param match is found', () => {
    const result = resolveKeySwaps({
      getPartitionKey: () => ['PARTITION'],
      getRangeKey: ({ someId }: { someId: string }) => ['HI', someId],
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
    const params = {
      getRangeKey: ({ someId }: { someId: string }) => ['HI', someId],

      getPartitionKey: ({ partId }: { partId: string }) => ['PARTITION', partId],

      paramMatch: {
        // this is vital! => on partition we lock this to entity prop so its ok
        partId: 'matchId' as const,
      },
    };

    const { getKey, getPartitionKey, getRangeKey } = resolveKeySwaps<
      EntityReference,
      typeof params
    >(params);

    expect(getPartitionKey({ matchId: 'partSwap!' })).toEqual(['PARTITION', 'partSwap!']);
    expect(getRangeKey({ someId: 'id!' })).toEqual(['HI', 'id!']);

    expect(getKey({ someId: 'id!', matchId: 'partSwap!' })).toEqual({
      partitionKey: ['PARTITION', 'partSwap!'],
      rangeKey: ['HI', 'id!'],
    });

    // -- TYPES --

    // @ts-expect-error require params
    getKey();

    // @ts-expect-error someId, matchId required
    getKey({});

    // @ts-expect-error matchId required
    getKey({ someId: '12' });

    // @ts-expect-error someId, matchId required
    getKey({ matchId: '11212' });
  });

  it('should swap range key param (single)', () => {
    const params = {
      getRangeKey: ({ someId }: { someId: string }) => ['HI', someId],

      getPartitionKey: () => ['PARTITION'],

      paramMatch: {
        someId: 'matchId' as const,
      },
    };

    const { getKey, getPartitionKey, getRangeKey } = resolveKeySwaps<
      EntityReference,
      typeof params
    >(params);

    expect(getPartitionKey()).toEqual(['PARTITION']);

    // @ts-expect-error we are testing paramMatchers, unknown or match props should be handled
    expect(getRangeKey({ someId: 'id!', matchId: 'matchId!' })).toEqual([
      'HI',
      'matchId!',
    ]);

    expect(
      // @ts-expect-error we are testing paramMatchers, unknown or match props should be handled
      getKey({ someId: 'id!', matchId: 'matchId!', other: 'should not be present' }),
    ).toEqual({
      partitionKey: ['PARTITION'],
      rangeKey: ['HI', 'matchId!'],
    });

    // -- TYPES --

    // @ts-expect-error require params
    getKey();

    // @ts-expect-error matchId required
    getKey({});

    // @ts-expect-error matchId required
    getKey({ someId: '12' });

    getKey({ matchId: '11212' });
  });

  it('should swap multiple key params', () => {
    const params = {
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
      } as const,
    };

    const { getKey, getPartitionKey, getRangeKey } = resolveKeySwaps<
      EntityReference,
      typeof params
    >(params);

    expect(
      getPartitionKey({ partId: 'partId', otherKeyId: 'otherKey', createdAt: 'some-tz' }),
    ).toEqual(['PARTITION', 'partId', 'otherKey', 'some-tz']);

    expect(getRangeKey({ matchId: 'matchId!', anotherId: 'another1' })).toEqual([
      'HI',
      'matchId!',
      'another1',
    ]);

    expect(
      getKey({
        // @ts-expect-error handles all...
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

    // -- TYPES --

    // @ts-expect-error require params
    getKey();

    type PartParams = Parameters<typeof getPartitionKey>[0];
    type RangeParams = Parameters<typeof getRangeKey>[0];
    type KeyParams = Parameters<typeof getKey>[0];

    type _R = Expect<
      Equal<
        KeyParams,
        {
          matchId: string;
          otherKeyId: string;
          createdAt: string;
          partId: string;
          anotherId: string;
        }
      >
    >;

    type _Range = Expect<
      Equal<
        RangeParams,
        {
          matchId: string;
          anotherId: string;
        }
      >
    >;

    type _Part = Expect<
      Equal<
        PartParams,
        {
          otherKeyId: string;
          createdAt: string;
          partId: string;
        }
      >
    >;
  });
});
