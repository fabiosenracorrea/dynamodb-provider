/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, PrettifyObject } from 'types';
import { SingleTableSchema } from '../../schema';

import { tableConfig, type User } from './helpers.test';

type UserLoginAttempt = {
  userId: string;
  timestamp: string;
  device: string;
  success: boolean;
};

describe('single table schema tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('basic properties', () => {
    const schema = new SingleTableSchema(tableConfig);

    const partition = schema.createPartition({
      name: 'USER_PARTITION',
      getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
      entries: {
        data: () => [`#DATA`],
        permissions: () => [`#PERMISSIONS`],
        loginAttempts: ({ timestamp }: { timestamp: string }) => [
          'LOGIN_ATTEMPT',
          timestamp,
        ],
      },
    });

    const user = partition
      .use('data')
      .create<User>()
      .entity({
        type: 'USER',

        paramMatch: { userId: 'id' },
      });

    const loginAttempts = partition
      .use('loginAttempts')
      .create<UserLoginAttempt>()
      .entity({
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
                        type: 'MULTIPLE',
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

      expect(collection.join.loginAttempts.join.deep2.join.deep3.join.deep4.ref).toBe(
        user.type,
      );
      expect(collection.join.loginAttempts.join.deep2.join.deep3.join.deep4.entity).toBe(
        user,
      );

      // -- TYPES --

      type Collection = (typeof collection)['__type'];

      type Expected = PrettifyObject<
        User & {
          loginAttempts: UserLoginAttempt & {
            deep2: UserLoginAttempt & { deep3: User & { deep4: User[] } };
          };
        }
      >;

      type _Tests = [
        Expect<Equal<Collection, Expected>>,

        Expect<Equal<Collection['loginAttempts']['deep2']['deep3']['deep4'], User[]>>,
      ];
    });
  });

  describe('collection index ref', () => {
    it('should infer partition index', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'someIndex',
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
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

        getPartitionKey: ({ userId }: { userId: string }) => [
          'USER_LOGIN_ATTEMPT',
          userId,
        ],

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

      expect(userCollection.index).toBe('someIndex');
    });

    it('should allow index if configured', () => {
      const schema = new SingleTableSchema(tableConfig);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USERS'],

        getRangeKey: ({ createdAt }: { createdAt: string }) => [createdAt],

        indexes: {
          singleUser: {
            getPartitionKey: ({ id }: { id: string }) => ['USER', id],

            getRangeKey: () => [`#DATA`],

            index: 'someIndex',
          },
        },
      });

      const loginAttempts = schema.createEntity<UserLoginAttempt>().as({
        type: 'USER_LOGIN_ATTEMPT',

        getPartitionKey: ({ userId }: { userId: string }) => [
          'USER_LOGIN_ATTEMPT',
          userId,
        ],

        getRangeKey: ({ timestamp }: { timestamp: string }) => [timestamp],

        indexes: {
          singleUser: {
            getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

            getRangeKey: ({ timestamp }: { timestamp: string }) => [
              'LOGIN_ATTEMPT',
              timestamp,
            ],

            index: 'someIndex',
          },
        },
      });

      const userCollection = schema.createCollection({
        type: 'SINGLE',

        ref: user,

        index: 'someIndex',

        getPartitionKey: loginAttempts.indexes.singleUser.getPartitionKey,

        join: {
          loginAttempts: {
            type: 'MULTIPLE',
            entity: loginAttempts,
          },
        },
      });

      expect(userCollection.index).toBe('someIndex');
    });
  });
});
