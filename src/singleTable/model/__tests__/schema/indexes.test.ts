/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter, RequiredKeys } from 'types';

import { SingleTableSchema } from '../../schema';

import { tableConfig, User } from './helpers.test';

const baseEntityParams = {
  type: 'USER',

  getPartitionKey: ({ id }: { id: string }) => ['USER', id],

  getRangeKey: () => ['#DATA'],
};

describe('single table schema - entity - indexes', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should properly handle index base props', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: () => ['USERS_BY_EMAIL'],
          getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
          index: 'anotherIndex',
        },
      },
    });

    expect(user.indexes.BY_EMAIL.index).toBe('anotherIndex');
    expect(user.indexes.BY_EMAIL.getPartitionKey()).toStrictEqual(['USERS_BY_EMAIL']);
    expect(user.indexes.BY_EMAIL.getRangeKey({ email: 'email@EMAIL.com' })).toStrictEqual([
      'email@email.com',
    ]);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'email@EMAIL.com',
      }),
    ).toStrictEqual({
      partitionKey: ['USERS_BY_EMAIL'],
      rangeKey: ['email@email.com'],
    });
  });

  it('should properly generate getCreationIndexMapping', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: () => ['USERS_BY_EMAIL'],
          getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
          index: 'anotherIndex',
        },

        BY_NAME: {
          getPartitionKey: () => ['USERS_BY_NAME'],
          getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
          index: 'someIndex',
        },
      },
    });

    const indexMapping = user.getCreationIndexMapping({
      email: 'some@email.com',
      name: 'Username',
    });

    expect(indexMapping).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['some@email.com'],
      },

      someIndex: {
        partitionKey: ['USERS_BY_NAME'],
        rangeKey: ['_name', 'username'],
      },
    });
  });

  it('getCreationIndexMapping should allow incomplete references', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: () => ['USERS_BY_EMAIL'],
          getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
          index: 'anotherIndex',
        },

        BY_NAME: {
          getPartitionKey: () => ['USERS_BY_NAME'],
          getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
          index: 'someIndex',
        },
      },
    });

    const indexMapping = user.getCreationIndexMapping({
      email: 'some@email.com',
    });

    expect(indexMapping).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['some@email.com'],
      },

      someIndex: {
        partitionKey: ['USERS_BY_NAME'],
      },
    });
  });

  it('should properly generate getUpdatedIndexMapping', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],

      indexes: {
        BY_EMAIL: {
          getPartitionKey: () => ['USERS_BY_EMAIL'],
          getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
          index: 'anotherIndex',
        },

        BY_NAME: {
          getPartitionKey: () => ['USERS_BY_NAME'],
          getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
          index: 'someIndex',
        },
      },
    });

    const indexMapping = user.getUpdatedIndexMapping({
      email: 'some@email.com',
      name: 'Username',
    });

    expect(indexMapping).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['some@email.com'],
      },

      someIndex: {
        partitionKey: ['USERS_BY_NAME'],
        rangeKey: ['_name', 'username'],
      },
    });
  });

  it('getUpdatedIndexMapping should allow incomplete references', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],

      indexes: {
        BY_EMAIL: {
          getPartitionKey: () => ['USERS_BY_EMAIL'],
          getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
          index: 'anotherIndex',
        },

        BY_NAME: {
          getPartitionKey: () => ['USERS_BY_NAME'],
          getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
          index: 'someIndex',
        },
      },
    });

    const indexMapping = user.getUpdatedIndexMapping({
      email: 'some@email.com',
    });

    expect(indexMapping).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['some@email.com'],
      },

      someIndex: {
        partitionKey: ['USERS_BY_NAME'],
      },
    });
  });

  describe('rangeQueries', () => {
    it('range queries: should handle NO param queries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        indexes: {
          BY_EMAIL: {
            getPartitionKey: () => ['USERS_BY_EMAIL'],
            getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
            index: 'anotherIndex',
            rangeQueries: {
              aEmails: {
                operation: 'begins_with',
                getValues: () => ({
                  value: 'a',
                }),
              },
            },
          },
        },
      });

      expect(user.indexes.BY_EMAIL.rangeQueries.aEmails()).toStrictEqual({
        operation: 'begins_with',
        value: `a`,
      });
    });

    it('range queries: should handle param queries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        indexes: {
          BY_EMAIL: {
            getPartitionKey: () => ['USERS_BY_EMAIL'],
            getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
            index: 'anotherIndex',
            rangeQueries: {
              prefix: {
                operation: 'begins_with',
                getValues: ({ emailStart }: { emailStart: string }) => ({
                  value: emailStart,
                }),
              },
            },
          },
        },
      });

      expect(
        user.indexes.BY_EMAIL.rangeQueries.prefix({
          emailStart: 'fab',
        }),
      ).toStrictEqual({
        operation: 'begins_with',
        value: `fab`,
      });
    });
  });
});
