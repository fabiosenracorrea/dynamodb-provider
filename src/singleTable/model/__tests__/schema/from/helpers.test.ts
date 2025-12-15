/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyEntity } from '../../../definitions';

export interface User {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
}

export const baseParams = {
  dynamodbProvider: {} as any,
  partitionKey: 'hello',
  rangeKey: 'key',
  table: 'my-table',

  typeIndex: {
    name: 'TypeIndexName',
    partitionKey: '_type',
    rangeKey: '_ts',
  },

  expiresAt: '_expires',

  indexes: {
    someIndex: {
      partitionKey: '_indexHash1',
      rangeKey: '_indexRange1',
    },

    anotherIndex: {
      partitionKey: '_indexHash2',
      rangeKey: '_indexRange2',
    },

    yetAnotherIndex: {
      partitionKey: '_indexHash3',
      rangeKey: '_indexRange3',
    },
  },
};

export function paramsFor<T extends 'get' | 'batchGet' | 'delete' | 'create' | 'update'>(
  method: T,
  returnValue?: any,
) {
  return {
    ...baseParams,

    dynamodbProvider: {
      [method]: jest.fn().mockResolvedValue(returnValue),
    } as any,
  };
}

export function keyFor<T extends AnyEntity>(
  entity: T,
  params: Parameters<T['getKey']>[0],
) {
  return {
    [baseParams.partitionKey]: (entity.getPartitionKey(params) as string[]).join('#'),
    [baseParams.rangeKey]: (entity.getRangeKey(params) as string[]).join('#'),
  };
}

describe('[BONUS!] test helpers', () => {
  it('should be here', () => {
    expect(true).toBe(true);
  });
});
