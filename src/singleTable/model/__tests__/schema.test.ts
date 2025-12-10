/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter } from 'types';
import { SingleTableSchema } from '../schema';

describe('single table schema tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('create entity tests', () => {
    describe('update params', () => {
      it('should properly build key reference', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
        });
      });

      it('should handle expiresAt', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,
        });
      });

      it('should handle indexes', () => {
        const schema = new SingleTableSchema(config);

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
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,

          indexes: {
            anotherIndex: {
              partitionKey: ['USERS_BY_EMAIL'],
              rangeKey: ['new@email.com'],
            },
          },
        });
      });

      it('should simply forward atomicOperations, conditions, remove and returnUpdatedProperties values', () => {
        const schema = new SingleTableSchema(config);

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
          },
        });

        const forwardValues = {
          atomicOperations: Symbol('atomicOperations'),
          conditions: Symbol('conditions'),
          remove: Symbol('remove'),
          returnUpdatedProperties: Symbol('returnUpdatedProperties'),
        } as any;

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,

          ...forwardValues,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,

          indexes: {
            anotherIndex: {
              partitionKey: ['USERS_BY_EMAIL'],
              rangeKey: ['new@email.com'],
            },
          },

          ...forwardValues,
        });
      });
    });
  });

  describe('partition tests', () => {
    describe('entity partition tests', () => {
      it('should not allow 2 usages of the same entry', () => {
        const schema = new SingleTableSchema(config);

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const doubleUsage = () => {
          partition.use('data');

          partition.use('data');
        };

        expect(doubleUsage).toThrow();
      });

      it('should not contain "index" method', () => {
        const schema = new SingleTableSchema(config);

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const creator = partition.use('data').create<{ some: string }>();

        expect('index' in creator).toBe(false);
      });

      it('should throw on bad entry reference', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const badRef = () => {
          partition.use('dataa' as any);
        };

        expect(badRef).toThrow();
      });

      it('should properly build entity from entry', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        expect(partition.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = partition.use('data').create<User>().entity({
          type: 'USER',
        });

        expect(user.__dbType).toBe('ENTITY');
        expect(user.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);
        expect(user.getRangeKey()).toStrictEqual(['#DATA']);
        expect(user.getKey({ userId: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should properly build entity with param-match', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        expect(partition.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = partition
          .use('data')
          .create<User>()
          .entity({
            type: 'USER',

            paramMatch: {
              userId: 'id',
            },
          });

        expect(user.__dbType).toBe('ENTITY');

        expect(user.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

        expect(user.getRangeKey()).toStrictEqual(['#DATA']);

        expect(user.getKey({ id: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });
    });

    describe('index partition tests', () => {
      it('should not allow 2 usages of the same entry', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          index: 'anotherIndex',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const doubleUsage = () => {
          partition.use('data');

          partition.use('data');
        };

        expect(doubleUsage).toThrow();
      });

      it('should not contain "entity" method', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          index: 'anotherIndex',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const creator = partition.use('data').create<any>();

        expect('entity' in creator).toBe(false);
      });

      it('should throw on bad entry reference', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          index: 'anotherIndex',
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const badRef = () => {
          partition.use('dataa' as any);
        };

        expect(badRef).toThrow();
      });

      it('should properly build a standard index', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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
        });

        const indexPartition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          index: 'anotherIndex',

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const index = indexPartition.use('data').create<User>().index();

        expect(index.index).toBe('anotherIndex');

        expect(index.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        // @ts-expect-error bad inference, it should not take params here
        expect(index.getRangeKey()).toStrictEqual(['#DATA']);

        expect(index.getKey({ userId: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should build a standard index with param match', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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
        });

        const indexPartition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          index: 'anotherIndex',

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const index = indexPartition
          .use('data')
          .create<User>()
          .index({
            paramMatch: {
              userId: 'id',
            },
          });

        expect(index.index).toBe('anotherIndex');

        expect(index.getPartitionKey({ id: 'idd' } as any)).toStrictEqual(['USER', 'idd']);

        expect(index.getRangeKey({})).toStrictEqual(['#DATA']);

        expect(index.getKey({ id: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should allow range queries to be forwarded', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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
        });

        const indexPartition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          index: 'anotherIndex',

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const rangeQueries = {
          userData: {
            operation: 'begins_with' as const,
            getValues: () => ({
              value: '#DATA',
            }),
          },

          someBetweenQuery: {
            operation: 'between' as const,
            getValues: ({ start, end }: { start: string; end: string }) => ({
              start,
              end,
            }),
          },
        };

        const index = indexPartition.use('data').create<User>().index({
          rangeQueries,
        });

        expect(index.rangeQueries).toEqual(rangeQueries);
      });
    });
  });

  describe('collection tests', () => {
    type User = {
      name: string;
      id: string;
      email: string;
      address: string;
      dob: string;
      createdAt: string;
      updatedAt?: string;
    };

    type UserLoginAttempt = {
      userId: string;
      timestamp: string;
      device: string;
      success: boolean;
    };

    const params = {
      partitionKey: 'hello',
      rangeKey: 'key',

      table: 'my-table',
    };

    describe('basic properties', () => {
      const schema = new SingleTableSchema(params);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
        },
      });

      const user = partition
        .use('data')
        .create<User>()
        .entity({
          type: 'USER',

          paramMatch: { userId: 'id' },
        });

      const loginAttempts = partition.use('loginAttempts').create<UserLoginAttempt>().entity({
        type: 'USER_LOGIN_ATTEMPT',
      });

      it('should have the __dbType property', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          getPartitionKey: user.getPartitionKey,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.__dbType).toBe('COLLECTION');
      });

      it('should have the originEntity property', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          getPartitionKey: user.getPartitionKey,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.originEntity).toBe(user);
      });

      it('should have the startRef if entity is defined', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          getPartitionKey: user.getPartitionKey,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.startRef).toBe(user.type);
      });

      it('should have the same getPartitionKey as passed directly', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          getPartitionKey: user.getPartitionKey,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.getPartitionKey({ id: 'someId' })).toStrictEqual(
          user.getPartitionKey({ id: 'someId' }),
        );
      });

      it('should have the same getPartitionKey as passed via partition', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          partition,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.getPartitionKey({ userId: 'someId' })).toStrictEqual(
          partition.getPartitionKey({ userId: 'someId' }),
        );
      });

      it('should forward narrowBy/type properties', () => {
        const type = Symbol('type');
        const narrowBy = Symbol('narrowBy');

        const collection = schema.createCollection({
          type: type as any,
          narrowBy: narrowBy as any,

          partition,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.narrowBy).toBe(narrowBy);
        expect(collection.type).toBe(type);
      });

      it('should forward sorter when MULTIPLE', () => {
        const sorter = Symbol('sorter');

        const collection = schema.createCollection({
          type: 'MULTIPLE',

          partition,

          ref: user,

          sorter: sorter as any,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.sorter).toBe(sorter);
      });

      it('join: should default join method to POSITION', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          partition,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.join.loginAttempts.joinBy).toBe('POSITION');
      });

      it('join: should add the ref property derived from entity type', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          partition,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',
            },
          },
        });

        expect(collection.join.loginAttempts.ref).toBe(loginAttempts.type);
      });

      it('join: adds no matter how deep it is', () => {
        const collection = schema.createCollection({
          type: 'SINGLE',

          partition,

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,
              type: 'SINGLE',

              join: {
                deep2: {
                  entity: loginAttempts,
                  type: 'SINGLE',

                  join: {
                    deep3: {
                      entity: user,
                      type: 'SINGLE',

                      join: {
                        deep4: {
                          entity: user,
                          type: 'SINGLE',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        expect(collection.join.loginAttempts.join.deep2.ref).toBe(loginAttempts.type);
        expect(collection.join.loginAttempts.join.deep2.entity).toBe(loginAttempts);

        expect(collection.join.loginAttempts.join.deep2.join.deep3.ref).toBe(user.type);
        expect(collection.join.loginAttempts.join.deep2.join.deep3.entity).toBe(user);

        expect(collection.join.loginAttempts.join.deep2.join.deep3.join.deep4.ref).toBe(user.type);
        expect(collection.join.loginAttempts.join.deep2.join.deep3.join.deep4.entity).toBe(user);
      });
    });

    describe('collection index ref', () => {
      it('should infer partition index', () => {
        const schema = new SingleTableSchema({
          ...params,

          indexes: {
            oneIndex: {
              partitionKey: '_pk1',
              rangeKey: '_sk1',
            },
          },
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          index: 'oneIndex',
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: () => ['USERS'],

          getRangeKey: ({ createdAt }: { createdAt: string }) => [createdAt],

          indexes: {
            singleUser: partition
              .use('data')
              .create<User>()
              .index({
                paramMatch: { userId: 'id' },
              }),
          },
        });

        const loginAttempts = schema.createEntity<UserLoginAttempt>().as({
          type: 'USER_LOGIN_ATTEMPT',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER_LOGIN_ATTEMPT', userId],

          getRangeKey: ({ timestamp }: { timestamp: string }) => [timestamp],

          indexes: {
            singleUser: partition.use('loginAttempts').create<UserLoginAttempt>().index(),
          },
        });

        const userCollection = schema.createCollection({
          type: 'SINGLE',

          ref: user,

          partition,

          join: {
            loginAttempts: {
              type: 'MULTIPLE',
              entity: loginAttempts,
            },
          },
        });

        expect(userCollection.index).toBe('oneIndex');
      });

      it('should allow index if configured', () => {
        const schema = new SingleTableSchema({
          ...params,

          indexes: {
            oneIndex: {
              partitionKey: '_pk1',
              rangeKey: '_sk1',
            },
          },
        });

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: () => ['USERS'],

          getRangeKey: ({ createdAt }: { createdAt: string }) => [createdAt],

          indexes: {
            singleUser: {
              getPartitionKey: ({ id }: { id: string }) => ['USER', id],

              getRangeKey: () => [`#DATA`],

              index: 'oneIndex',
            },
          },
        });

        const loginAttempts = schema.createEntity<UserLoginAttempt>().as({
          type: 'USER_LOGIN_ATTEMPT',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER_LOGIN_ATTEMPT', userId],

          getRangeKey: ({ timestamp }: { timestamp: string }) => [timestamp],

          indexes: {
            singleUser: {
              getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

              getRangeKey: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],

              index: 'oneIndex',
            },
          },
        });

        const userCollection = schema.createCollection({
          type: 'SINGLE',

          ref: user,

          index: 'oneIndex',

          getPartitionKey: loginAttempts.indexes.singleUser.getPartitionKey,

          join: {
            loginAttempts: {
              type: 'MULTIPLE',
              entity: loginAttempts,
            },
          },
        });

        expect(userCollection.index).toBe('oneIndex');
      });
    });
  });
});
