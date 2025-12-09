/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect } from 'types';
import { randomUUID } from 'crypto';

import { SingleTableSchema } from '../../schema';
import { tableConfig, User } from './helpers.test';

jest.mock('crypto');

describe('single table schema - entity - autogen', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('creation: should auto-gen specified fields', () => {
    const schema = new SingleTableSchema(tableConfig);

    interface User123 extends User {
      hash: string;
    }

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));
    (randomUUID as jest.Mock).mockReturnValue('mocked-uuid');

    const user = schema.createEntity<User123>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onCreate: {
          id: 'UUID',
          createdAt: 'timestamp',
          hash: () => 'my-hash',
        },
      },
    });

    schema.from(user);

    const creationParams = {
      address: 'address',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
    };

    const params = user.getCreationParams(creationParams);

    expect(params.item).toStrictEqual({
      ...creationParams,

      createdAt: mockTimestamp,
      id: 'mocked-uuid',
      hash: 'my-hash',
    });

    jest.useRealTimers();

    type _T = Expect<Equal<typeof params.item, User123>>;
  });

  it('update: should auto-gen specified fields', () => {
    const schema = new SingleTableSchema(tableConfig);

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],

      autoGen: {
        onUpdate: {
          updatedAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const params = user.getUpdateParams({
      id: 'user-id',

      values: {
        email: 'new@email.com',
      },
    });

    expect(params.values).toStrictEqual({
      email: 'new@email.com',
      updatedAt: mockTimestamp,
    });

    jest.useRealTimers();
  });

  it('creation: should NOT overwrite provided values', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onCreate: {
          id: 'UUID',
          createdAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const creationParams = {
      id: 'user-provided-id',
      address: 'address',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
      createdAt: '2020-01-01T00:00:00.000Z',
    };

    const params = user.getCreationParams(creationParams);

    expect(params.item).toStrictEqual(creationParams);
  });

  it('creation: should handle partial auto-gen', () => {
    const schema = new SingleTableSchema(tableConfig);

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));
    (randomUUID as jest.Mock).mockReturnValue('mocked-uuid');

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onCreate: {
          id: 'UUID',
          createdAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const creationParams = {
      id: 'explicit-id',
      address: 'address',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
    };

    const params = user.getCreationParams(creationParams);

    expect(params.item).toStrictEqual({
      ...creationParams,
      createdAt: mockTimestamp,
    });

    expect(params.item.id).toBe('explicit-id');

    jest.useRealTimers();
  });

  it('update: should NOT overwrite provided values', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onUpdate: {
          updatedAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const params = user.getUpdateParams({
      id: 'user-id',
      values: {
        email: 'new@email.com',
        updatedAt: '2020-01-01T00:00:00.000Z',
      },
    });

    expect(params.values).toStrictEqual({
      email: 'new@email.com',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
  });

  it('update: should add values object if not present', () => {
    const schema = new SingleTableSchema(tableConfig);

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onUpdate: {
          updatedAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const params = user.getUpdateParams({
      id: 'user-id',
      remove: ['email'],
    });

    expect(params.values).toStrictEqual({
      updatedAt: mockTimestamp,
    });

    expect(params.remove).toStrictEqual(['email']);

    jest.useRealTimers();
  });

  it('update: should preserve other update parameters', () => {
    const schema = new SingleTableSchema(tableConfig);

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    interface User333 extends User {
      loginCount: number;
    }

    const user = schema.createEntity<User333>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onUpdate: {
          updatedAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const params = user.getUpdateParams({
      id: 'user-id',
      values: {
        email: 'new@email.com',
      },
      remove: ['address'],
      atomicOperations: [{ type: 'add', property: 'loginCount', value: 1 }],
      conditions: [{ operation: 'exists', property: 'id' }],
      returnUpdatedProperties: true,
    });

    expect(params.values).toStrictEqual({
      email: 'new@email.com',
      updatedAt: mockTimestamp,
    });

    expect(params.remove).toStrictEqual(['address']);
    expect(params.atomicOperations).toStrictEqual([
      { type: 'add', property: 'loginCount', value: 1 },
    ]);
    expect(params.conditions).toStrictEqual([{ operation: 'exists', property: 'id' }]);
    expect(params.returnUpdatedProperties).toBe(true);

    jest.useRealTimers();
  });

  it('update: should work with only atomicOperations', () => {
    const schema = new SingleTableSchema(tableConfig);

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    interface User3345 extends User {
      loginCount: number;
    }

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    const user = schema.createEntity<User3345>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onUpdate: {
          updatedAt: 'timestamp',
        },
      },
    });

    schema.from(user);

    const params = user.getUpdateParams({
      id: 'user-id',
      atomicOperations: [{ type: 'add', property: 'loginCount', value: 1 }],
    });

    expect(params.values).toStrictEqual({
      updatedAt: mockTimestamp,
    });

    expect(params.atomicOperations).toStrictEqual([
      { type: 'add', property: 'loginCount', value: 1 },
    ]);

    jest.useRealTimers();
  });

  it('[TYPES] should not accept random generator strings', () => {
    const schema = new SingleTableSchema(tableConfig);

    schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],

      autoGen: {
        onCreate: {
          // @ts-expect-error bad type
          updatedAt: 'bad',
        },

        onUpdate: {
          // @ts-expect-error bad type
          updatedAt: 'bad',
        },
      },
    });
  });
});
