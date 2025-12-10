/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter } from 'types';

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

  it('should properly handle index base props [getter no params + getter param]', () => {
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

    schema.from(user);

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

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, { email: string }>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getKey>, { email: string }>>,
    ];
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

    schema.from(user);

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

    schema.from(user);

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

    schema.from(user);

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

    schema.from(user);

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

  it('should handle index with getter param + getter param', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL_AND_NAME: {
          getPartitionKey: ({ email }: { email: string }) => ['BY_EMAIL', email],
          getRangeKey: ({ name }: { name: string }) => ['NAME', name],
          index: 'someIndex',
        },
      },
    });

    schema.from(user);

    expect(
      user.indexes.BY_EMAIL_AND_NAME.getPartitionKey({ email: 'test@test.com' }),
    ).toStrictEqual(['BY_EMAIL', 'test@test.com']);
    expect(user.indexes.BY_EMAIL_AND_NAME.getRangeKey({ name: 'John' })).toStrictEqual([
      'NAME',
      'John',
    ]);

    expect(
      user.indexes.BY_EMAIL_AND_NAME.getKey({
        email: 'user@example.com',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['BY_EMAIL', 'user@example.com'],
      rangeKey: ['NAME', 'Jane'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.BY_EMAIL_AND_NAME.getPartitionKey>,
          { email: string }
        >
      >,
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL_AND_NAME.getRangeKey>, { name: string }>
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.BY_EMAIL_AND_NAME.getKey>,
          { email: string; name: string }
        >
      >,
    ];
  });

  it('should handle index with getter no params + getter no params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        ALL_USERS: {
          getPartitionKey: () => ['ALL_USERS'],
          getRangeKey: () => ['#DATA'],
          index: 'yetAnotherIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.ALL_USERS.getPartitionKey()).toStrictEqual(['ALL_USERS']);
    expect(user.indexes.ALL_USERS.getRangeKey()).toStrictEqual(['#DATA']);
    expect(user.indexes.ALL_USERS.getKey()).toStrictEqual({
      partitionKey: ['ALL_USERS'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.indexes.ALL_USERS.getPartitionKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.ALL_USERS.getRangeKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.ALL_USERS.getKey>, undefined>>,
    ];
  });

  it('should handle index with array notation + array notation', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: ['USERS_BY_EMAIL'],
          getRangeKey: ['.email'],
          index: 'anotherIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL.getPartitionKey()).toStrictEqual(['USERS_BY_EMAIL']);
    expect(user.indexes.BY_EMAIL.getRangeKey({ email: 'test@test.com' })).toStrictEqual([
      'test@test.com',
    ]);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['USERS_BY_EMAIL'],
      rangeKey: ['user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, { email: string }>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getKey>, { email: string }>>,
    ];
  });

  it('should handle index with array notation with multiple refs', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL_NAME: {
          getPartitionKey: ['BY_EMAIL', '.email'],
          getRangeKey: ['NAME', '.name', '.createdAt'],
          index: 'someIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL_NAME.getPartitionKey({ email: 'test@test.com' })).toStrictEqual([
      'BY_EMAIL',
      'test@test.com',
    ]);
    expect(
      user.indexes.BY_EMAIL_NAME.getRangeKey({ name: 'John', createdAt: '2024-01-01' }),
    ).toStrictEqual(['NAME', 'John', '2024-01-01']);

    expect(
      user.indexes.BY_EMAIL_NAME.getKey({
        email: 'user@example.com',
        name: 'Jane',
        createdAt: '2024-01-01',
      }),
    ).toStrictEqual({
      partitionKey: ['BY_EMAIL', 'user@example.com'],
      rangeKey: ['NAME', 'Jane', '2024-01-01'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL_NAME.getPartitionKey>, { email: string }>
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.BY_EMAIL_NAME.getRangeKey>,
          { name: string; createdAt: string }
        >
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.BY_EMAIL_NAME.getKey>,
          { email: string; name: string; createdAt: string }
        >
      >,
    ];
  });

  it('should handle index with array notation + getter param', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: ['BY_EMAIL', '.email'],
          getRangeKey: ({ createdAt }: { createdAt: string }) => ['DATE', createdAt],
          index: 'anotherIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL.getPartitionKey({ email: 'test@test.com' })).toStrictEqual([
      'BY_EMAIL',
      'test@test.com',
    ]);
    expect(user.indexes.BY_EMAIL.getRangeKey({ createdAt: '2024-01-01' })).toStrictEqual([
      'DATE',
      '2024-01-01',
    ]);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'user@example.com',
        createdAt: '2024-01-01',
      }),
    ).toStrictEqual({
      partitionKey: ['BY_EMAIL', 'user@example.com'],
      rangeKey: ['DATE', '2024-01-01'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, { email: string }>
      >,
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, { createdAt: string }>
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.BY_EMAIL.getKey>,
          { email: string; createdAt: string }
        >
      >,
    ];
  });

  it('should handle index with getter param + array notation', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: ({ email }: { email: string }) => ['BY_EMAIL', email],
          getRangeKey: ['.createdAt'],
          index: 'someIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL.getPartitionKey({ email: 'test@test.com' })).toStrictEqual([
      'BY_EMAIL',
      'test@test.com',
    ]);
    expect(user.indexes.BY_EMAIL.getRangeKey({ createdAt: '2024-01-01' })).toStrictEqual([
      '2024-01-01',
    ]);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'user@example.com',
        createdAt: '2024-01-01',
      }),
    ).toStrictEqual({
      partitionKey: ['BY_EMAIL', 'user@example.com'],
      rangeKey: ['2024-01-01'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, { email: string }>
      >,
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, { createdAt: string }>
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.BY_EMAIL.getKey>,
          { email: string; createdAt: string }
        >
      >,
    ];
  });

  it('should handle index with getter param + getter no params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: ({ email }: { email: string }) => ['BY_EMAIL', email],
          getRangeKey: () => ['#DATA'],
          index: 'yetAnotherIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL.getPartitionKey({ email: 'test@test.com' })).toStrictEqual([
      'BY_EMAIL',
      'test@test.com',
    ]);
    expect(user.indexes.BY_EMAIL.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['BY_EMAIL', 'user@example.com'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, { email: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getKey>, { email: string }>>,
    ];
  });

  it('should handle index with array notation + getter no params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: ['.email'],
          getRangeKey: () => ['#DATA'],
          index: 'anotherIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL.getPartitionKey({ email: 'test@test.com' })).toStrictEqual([
      'test@test.com',
    ]);
    expect(user.indexes.BY_EMAIL.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['user@example.com'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, { email: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getKey>, { email: string }>>,
    ];
  });

  it('should handle index with getter no params + array notation', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        BY_EMAIL: {
          getPartitionKey: () => ['ALL_USERS'],
          getRangeKey: ['.email'],
          index: 'someIndex',
        },
      },
    });

    schema.from(user);

    expect(user.indexes.BY_EMAIL.getPartitionKey()).toStrictEqual(['ALL_USERS']);
    expect(user.indexes.BY_EMAIL.getRangeKey({ email: 'test@test.com' })).toStrictEqual([
      'test@test.com',
    ]);

    expect(
      user.indexes.BY_EMAIL.getKey({
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['ALL_USERS'],
      rangeKey: ['user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getPartitionKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getRangeKey>, { email: string }>>,
      Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.getKey>, { email: string }>>,
    ];
  });

  it('should handle index with getter with multiple params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

      indexes: {
        COMPOSITE: {
          getPartitionKey: ({ email, name }: { email: string; name: string }) => [
            'COMPOSITE',
            email,
            name,
          ],
          getRangeKey: ({ createdAt, address }: { createdAt: string; address: string }) => [
            'DATE',
            createdAt,
            address,
          ],
          index: 'yetAnotherIndex',
        },
      },
    });

    schema.from(user);

    expect(
      user.indexes.COMPOSITE.getPartitionKey({ email: 'test@test.com', name: 'John' }),
    ).toStrictEqual(['COMPOSITE', 'test@test.com', 'John']);
    expect(
      user.indexes.COMPOSITE.getRangeKey({ createdAt: '2024-01-01', address: '123 St' }),
    ).toStrictEqual(['DATE', '2024-01-01', '123 St']);

    expect(
      user.indexes.COMPOSITE.getKey({
        email: 'user@example.com',
        name: 'Jane',
        createdAt: '2024-01-01',
        address: '456 Ave',
      }),
    ).toStrictEqual({
      partitionKey: ['COMPOSITE', 'user@example.com', 'Jane'],
      rangeKey: ['DATE', '2024-01-01', '456 Ave'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.COMPOSITE.getPartitionKey>,
          { email: string; name: string }
        >
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.COMPOSITE.getRangeKey>,
          { createdAt: string; address: string }
        >
      >,
      Expect<
        Equal<
          FirstParameter<typeof user.indexes.COMPOSITE.getKey>,
          { email: string; name: string; createdAt: string; address: string }
        >
      >,
    ];
  });

  describe('rangeQueries', () => {
    it('range queries: should handle NO param queries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        ...baseEntityParams,

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

      schema.from(user);

      expect(user.indexes.BY_EMAIL.rangeQueries.aEmails()).toStrictEqual({
        operation: 'begins_with',
        value: `a`,
      });

      // -- TYPES --

      type _Tests = [
        Expect<Equal<FirstParameter<typeof user.indexes.BY_EMAIL.rangeQueries.aEmails>, undefined>>,
      ];
    });

    it('range queries: should handle param queries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        ...baseEntityParams,

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

      schema.from(user);

      expect(
        user.indexes.BY_EMAIL.rangeQueries.prefix({
          emailStart: 'fab',
        }),
      ).toStrictEqual({
        operation: 'begins_with',
        value: `fab`,
      });

      // -- TYPES --

      type _Tests = [
        Expect<
          Equal<
            FirstParameter<typeof user.indexes.BY_EMAIL.rangeQueries.prefix>,
            { emailStart: string }
          >
        >,
      ];
    });
  });

  describe('type validations', () => {
    it('[TYPES] should not allow index partition key params not present on entity', () => {
      const schema = new SingleTableSchema(tableConfig);

      schema.createEntity<User>().as({
        ...baseEntityParams,

        indexes: {
          BAD_INDEX: {
            // @ts-expect-error only User props are allowed
            getPartitionKey: ({ __bad__ }: { __bad__: string }) => ['BAD', __bad__],
            getRangeKey: () => ['#DATA'],
            index: 'someIndex',
          },
        },
      });
    });

    it('[TYPES] should not allow index partition key params different from Entity type', () => {
      const schema = new SingleTableSchema(tableConfig);

      schema.createEntity<User>().as({
        ...baseEntityParams,

        indexes: {
          BAD_INDEX: {
            // @ts-expect-error User.email is string
            getPartitionKey: ({ email }: { email: number }) => ['BAD', email],
            getRangeKey: () => ['#DATA'],
            index: 'someIndex',
          },
        },
      });
    });

    it('[TYPES] should not allow index range key params not present on entity', () => {
      const schema = new SingleTableSchema(tableConfig);

      schema.createEntity<User>().as({
        ...baseEntityParams,

        indexes: {
          BAD_INDEX: {
            getPartitionKey: () => ['INDEX'],
            // @ts-expect-error only User props are allowed
            getRangeKey: ({ __bad__ }: { __bad__: string }) => ['BAD', __bad__],
            index: 'someIndex',
          },
        },
      });
    });

    it('[TYPES] should not allow index range key params different from Entity type', () => {
      const schema = new SingleTableSchema(tableConfig);

      schema.createEntity<User>().as({
        ...baseEntityParams,

        indexes: {
          BAD_INDEX: {
            getPartitionKey: () => ['INDEX'],
            // @ts-expect-error User.name is string
            getRangeKey: ({ name }: { name: boolean }) => ['BAD', name],
            index: 'someIndex',
          },
        },
      });
    });
  });
});
