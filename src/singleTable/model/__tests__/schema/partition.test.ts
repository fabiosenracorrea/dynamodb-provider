/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter, PrettifyObject } from 'types';
import { KeyValue } from 'singleTable/adaptor/definitions';
import { SingleTableSchema } from '../../schema';
import { tableConfig, User } from './helpers.test';

describe('single table schema - partition', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('entity partition', () => {
    it('should not allow 2 usages of the same entry', () => {
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

      const doubleUsage = () => {
        partition.use('data');

        partition.use('data');
      };

      expect(doubleUsage).toThrow();
    });

    it('should not contain "index" method', () => {
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

      const creator = partition.use('data').create<{ some: string }>();

      expect('index' in creator).toBe(false);
      expect(creator.entity).toBeDefined();
    });

    it('should throw on bad entry reference', () => {
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

      const badRef = () => {
        partition.use('dataa' as any);
      };

      expect(badRef).toThrow();
    });

    it('should properly build entity from entry [partition params in entity + no range params]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      expect(partition.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

      const createEntity = partition.use('data').create<User>().entity;

      const user = createEntity({
        type: 'USER',
      });

      expect(user.__dbType).toBe('ENTITY');
      expect(user.type).toBe('USER');
      expect(user.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(user.getRangeKey()).toStrictEqual(['#DATA']);
      expect(user.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });

      schema.from(user);

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be optional (undefined) when all params exist in entity
        Expect<
          Equal<
            FirstParameter<typeof createEntity>['paramMatch'],
            { id?: keyof User } | undefined
          >
        >,
      ];
    });

    it('should properly build entity from entry [partition params in entity + range params in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          firstLogin: ({ createdAt }: { createdAt: string }) => [
            'FIRST_LOGIN',
            createdAt,
          ],
        },
      });

      const createEntity = partition.use('firstLogin').create<User>().entity;

      const firstLogin = createEntity({
        type: 'FIRST_LOGIN',
      });

      expect(firstLogin.__dbType).toBe('ENTITY');
      expect(firstLogin.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

      expect(firstLogin.getRangeKey({ createdAt: 'create' })).toStrictEqual([
        'FIRST_LOGIN',
        'create',
      ]);

      expect(firstLogin.getKey({ id: 'idd', createdAt: 'create' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['FIRST_LOGIN', 'create'],
      });

      schema.from(firstLogin);

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be optional when all params exist in entity
        Expect<
          Equal<
            FirstParameter<typeof createEntity>['paramMatch'],
            { id?: keyof User; createdAt?: keyof User } | undefined
          >
        >,
      ];
    });

    it('should required _paramMatch_ build entity from entry [partition params NOT on entity + no range params]', () => {
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

      expect(partition.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);
      const createEntity = partition.use('data').create<User>().entity;

      const user = createEntity({
        type: 'USER',

        paramMatch: { userId: 'id' },
      });

      expect(user.__dbType).toBe('ENTITY');
      expect(user.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(user.getRangeKey()).toStrictEqual(['#DATA']);

      expect(user.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });

      schema.from(user);

      // -- TYPES -- //

      type _Tests = [
        Expect<
          Equal<
            PrettifyObject<FirstParameter<typeof createEntity>['paramMatch']>,
            { userId: keyof User }
          >
        >,
      ];
    });

    it('should require _paramMatch_ build entity from entry [partition params NOT on entity + range params in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION_WITH_RANGE',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          firstLogin: ({ createdAt }: { createdAt: string }) => [
            'FIRST_LOGIN',
            createdAt,
          ],
        },
      });

      const createEntity = partition.use('firstLogin').create<User>().entity;

      const firstLogin = createEntity({
        type: 'FIRST_LOGIN',
        paramMatch: { userId: 'id' },
      });

      expect(firstLogin.__dbType).toBe('ENTITY');
      expect(firstLogin.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(firstLogin.getRangeKey({ createdAt: 'create' })).toStrictEqual([
        'FIRST_LOGIN',
        'create',
      ]);

      expect(firstLogin.getKey({ id: 'idd', createdAt: 'create' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['FIRST_LOGIN', 'create'],
      });

      schema.from(firstLogin);

      // -- TYPES -- //

      type _Tests = [
        Expect<
          Equal<
            PrettifyObject<FirstParameter<typeof createEntity>['paramMatch']>,
            { userId: keyof User; createdAt?: keyof User }
          >
        >,
      ];
    });

    it('should build entity [partition params in entity + range params NOT in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION_RANGE_NOT_IN_ENTITY',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        entries: {
          loginAttempt: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const createEntity = partition.use('loginAttempt').create<User>().entity;

      const loginAttempt = createEntity({
        type: 'USER_LOGIN_ATTEMPT',
        paramMatch: { timestamp: 'createdAt' },
      });

      expect(loginAttempt.__dbType).toBe('ENTITY');
      expect(loginAttempt.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(loginAttempt.getRangeKey({ createdAt: 'ts' })).toStrictEqual([
        'LOGIN_ATTEMPT',
        'ts',
      ]);

      expect(loginAttempt.getKey({ id: 'idd', createdAt: 'ts' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['LOGIN_ATTEMPT', 'ts'],
      });

      schema.from(loginAttempt);

      // -- TYPES -- //

      type _Tests = [
        Expect<
          Equal<
            PrettifyObject<FirstParameter<typeof createEntity>['paramMatch']>,
            { id?: keyof User; timestamp: keyof User }
          >
        >,
      ];
    });

    it('should build entity [partition params NOT in entity + range params NOT in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION_BOTH_NOT_IN_ENTITY',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          loginAttempt: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const createEntity = partition.use('loginAttempt').create<User>().entity;

      const loginAttempt = createEntity({
        type: 'USER_LOGIN_ATTEMPT',
        paramMatch: { userId: 'id', timestamp: 'createdAt' },
      });

      expect(loginAttempt.__dbType).toBe('ENTITY');
      expect(loginAttempt.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(loginAttempt.getRangeKey({ createdAt: 'ts' })).toStrictEqual([
        'LOGIN_ATTEMPT',
        'ts',
      ]);

      expect(loginAttempt.getKey({ id: 'idd', createdAt: 'ts' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['LOGIN_ATTEMPT', 'ts'],
      });

      schema.from(loginAttempt);

      // -- TYPES -- //

      type _Tests = [
        Expect<
          Equal<
            PrettifyObject<FirstParameter<typeof createEntity>['paramMatch']>,
            { userId: keyof User; timestamp: keyof User }
          >
        >,
      ];
    });

    it('[TYPES] should not require paramMatch when partition params exist in entity', () => {
      const schema = new SingleTableSchema(tableConfig);

      type EntityWithUserId = User & { userId: string };

      const partition = schema.createPartition({
        name: 'USER_PARTITION_OPTIONAL_MATCH',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          userData: () => [`#DATA`],
        },
      });

      // Should work without paramMatch since EntityWithUserId has 'userId'
      partition.use('userData').create<EntityWithUserId>().entity({
        type: 'USER',
      });
    });

    it('[TYPES] Should only allow use() on registered entries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const { use } = schema.createPartition({
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

      type Entries = FirstParameter<typeof use>;

      type _Test = Expect<Equal<Entries, 'data' | 'permissions' | 'loginAttempts'>>;
    });
  });

  describe('index partition', () => {
    it('should not allow 2 usages of the same entry', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        index: 'anotherIndex',
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

      const doubleUsage = () => {
        partition.use('data');

        partition.use('data');
      };

      expect(doubleUsage).toThrow();
    });

    it('Has index accessible', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        index: 'anotherIndex',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          data: () => [`#DATA`],
        },
      });

      expect(partition.index).toBe('anotherIndex');
    });

    it('should not contain "entity" method', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        index: 'anotherIndex',
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

      const creator = partition.use('data').create<any>();

      expect('entity' in creator).toBe(false);
      expect(creator.index).toBeDefined();
    });

    it('should throw on bad entry reference', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'anotherIndex',
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const badRef = () => {
        partition.use('dataa' as any);
      };

      expect(badRef).toThrow();
    });

    it('should properly build a standard index', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_PARTITION',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        index: 'anotherIndex',

        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const createIndex = indexPartition.use('data').create<User>().index;

      const index = createIndex();

      expect(index.index).toBe('anotherIndex');
      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(index.getRangeKey()).toStrictEqual(['#DATA']);
      expect(index.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be optional when all params exist in entity
        Expect<
          Equal<
            Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch'],
            { id?: keyof User } | undefined
          >
        >,
      ];
    });

    it('should build a standard index with param match', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_PARTITION',

        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

        index: 'anotherIndex',

        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const createIndex = indexPartition.use('data').create<User>().index;

      const index = createIndex({
        paramMatch: {
          userId: 'id',
        },
      });

      expect(index.index).toBe('anotherIndex');

      expect(index.getPartitionKey({ id: 'idd' } as any)).toStrictEqual(['USER', 'idd']);

      expect(index.getRangeKey()).toStrictEqual(['#DATA']);

      expect(index.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be required when params not in entity
        Expect<
          Equal<
            PrettifyObject<
              Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch']
            >,
            { userId: keyof User }
          >
        >,
      ];
    });

    it('should properly build index from entry [partition params in entity + range params in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        index: 'someIndex',
        entries: {
          data: () => [`#DATA`],
          firstLogin: ({ createdAt }: { createdAt: string }) => [
            'FIRST_LOGIN',
            createdAt,
          ],
        },
      });

      const createIndex = indexPartition.use('firstLogin').create<User>().index;

      const index = createIndex();

      expect(index.index).toBe('someIndex');
      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(index.getRangeKey({ createdAt: 'create' })).toStrictEqual([
        'FIRST_LOGIN',
        'create',
      ]);

      expect(index.getKey({ id: 'idd', createdAt: 'create' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['FIRST_LOGIN', 'create'],
      });

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be optional when all params exist in entity
        Expect<
          Equal<
            Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch'],
            { id?: keyof User; createdAt?: keyof User } | undefined
          >
        >,
      ];
    });

    it('should build index with paramMatch [partition params NOT on entity + no range params]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION_NO_RANGE',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'anotherIndex',
        entries: {
          userData: () => [`#DATA`],
        },
      });

      const createIndex = indexPartition.use('userData').create<User>().index;

      const index = createIndex({
        paramMatch: { userId: 'id' },
      });

      expect(index.index).toBe('anotherIndex');
      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(index.getRangeKey()).toStrictEqual(['#DATA']);

      expect(index.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be required when params not in entity
        Expect<
          Equal<
            PrettifyObject<
              Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch']
            >,
            { userId: keyof User }
          >
        >,
      ];
    });

    it('should build index with paramMatch [partition params NOT on entity + range params in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION_WITH_RANGE',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'someIndex',
        entries: {
          firstLogin: ({ createdAt }: { createdAt: string }) => [
            'FIRST_LOGIN',
            createdAt,
          ],
        },
      });

      const createIndex = indexPartition.use('firstLogin').create<User>().index;

      const index = createIndex({
        paramMatch: { userId: 'id' },
      });

      expect(index.index).toBe('someIndex');
      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(index.getRangeKey({ createdAt: 'create' })).toStrictEqual([
        'FIRST_LOGIN',
        'create',
      ]);

      expect(index.getKey({ id: 'idd', createdAt: 'create' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['FIRST_LOGIN', 'create'],
      });

      // -- TYPES -- //

      type _Tests = [
        // paramMatch should be required for partition params, optional for range params in entity
        Expect<
          Equal<
            PrettifyObject<
              Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch']
            >,
            { userId: keyof User; createdAt?: keyof User }
          >
        >,
      ];
    });

    it('[TYPES] should properly type paramMatch requirement when partition params not in entity', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION_TYPE_TEST',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'anotherIndex',
        entries: {
          userData: () => [`#DATA`],
        },
      });

      indexPartition
        .use('userData')
        .create<User>()
        .index({
          paramMatch: { userId: 'id' }, // Correct - required when partition params not in entity
        });
    });

    it('should build index [partition params in entity + range params NOT in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION_RANGE_NOT_IN_ENTITY',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        index: 'someIndex',
        entries: {
          loginAttempt: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const createIndex = indexPartition.use('loginAttempt').create<User>().index;

      const index = createIndex({
        paramMatch: { timestamp: 'createdAt' },
      });

      expect(index.index).toBe('someIndex');
      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(index.getRangeKey({ createdAt: 'ts' })).toStrictEqual([
        'LOGIN_ATTEMPT',
        'ts',
      ]);

      expect(index.getKey({ id: 'idd', createdAt: 'ts' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['LOGIN_ATTEMPT', 'ts'],
      });

      // -- TYPES -- //

      type _Tests = [
        Expect<
          Equal<
            PrettifyObject<
              Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch']
            >,
            { id?: keyof User; timestamp: keyof User }
          >
        >,
      ];
    });

    it('should build index [partition params NOT in entity + range params NOT in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION_BOTH_NOT_IN_ENTITY',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'anotherIndex',
        entries: {
          loginAttempt: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      const createIndex = indexPartition.use('loginAttempt').create<User>().index;

      const index = createIndex({
        paramMatch: { userId: 'id', timestamp: 'createdAt' },
      });

      expect(index.index).toBe('anotherIndex');
      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);
      expect(index.getRangeKey({ createdAt: 'ts' })).toStrictEqual([
        'LOGIN_ATTEMPT',
        'ts',
      ]);

      expect(index.getKey({ id: 'idd', createdAt: 'ts' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['LOGIN_ATTEMPT', 'ts'],
      });

      // -- TYPES -- //

      type _Tests = [
        Expect<
          Equal<
            PrettifyObject<
              Exclude<FirstParameter<typeof createIndex>, undefined>['paramMatch']
            >,
            { userId: keyof User; timestamp: keyof User }
          >
        >,
      ];
    });

    it('[TYPES] should not require paramMatch when partition params exist in entity', () => {
      const schema = new SingleTableSchema(tableConfig);

      type EntityWithUserId = User & { userId: string };

      const indexPartition = schema.createPartition({
        name: 'USER_INDEX_PARTITION_OPTIONAL_MATCH',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'anotherIndex',
        entries: {
          userData: () => [`#DATA`],
        },
      });

      // Should work without paramMatch since EntityWithUserId has 'userId'
      indexPartition.use('userData').create<EntityWithUserId>().index();
    });

    it('should allow range queries to be forwarded', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'USER_PARTITION',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        index: 'anotherIndex',

        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

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

    it('[TYPES] Should only allow use() on registered entries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const { use } = schema.createPartition({
        name: 'USER_INDEX_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        index: 'anotherIndex',
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => [
            'LOGIN_ATTEMPT',
            timestamp,
          ],
        },
      });

      type Entries = FirstParameter<typeof use>;

      type _Test = Expect<Equal<Entries, 'data' | 'permissions' | 'loginAttempts'>>;
    });
  });

  describe('toKeyPrefix', () => {
    it('should return correct key prefix for various entry patterns', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'KEY_PREFIX_TEST_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          // Entry with all constants - should return all values
          allConstants: () => ['METADATA', 'PROFILE'],

          // Entry with constants followed by variable - should return only constants
          constantsWithVariable: ({ timestamp }: { timestamp: string }) => [
            'LOG',
            'ERROR',
            timestamp,
          ],

          // Entry with variable as first element - should return empty array
          variableFirst: ({ id }: { id: string }) => [id, 'SUFFIX'],

          // Entry with single constant - should return that constant
          singleConstant: () => 'SETTINGS',

          // Entry with mixed constants and variables - should return prefix up to first variable
          mixedPattern: ({ date, level }: { date: string; level: string }) => [
            'AUDIT',
            'LOG',
            date,
            level,
          ],
        },
      });

      // Test all constants
      expect(partition.toKeyPrefix('allConstants')).toStrictEqual([
        'METADATA',
        'PROFILE',
      ]);

      // Test constants with variable
      expect(partition.toKeyPrefix('constantsWithVariable')).toStrictEqual([
        'LOG',
        'ERROR',
      ]);

      // Test variable first
      expect(partition.toKeyPrefix('variableFirst')).toStrictEqual([]);

      // Test single constant
      expect(partition.toKeyPrefix('singleConstant')).toStrictEqual(['SETTINGS']);

      // Test mixed pattern
      expect(partition.toKeyPrefix('mixedPattern')).toStrictEqual(['AUDIT', 'LOG']);

      if (false as any) {
        // @ts-expect-error only inferred entries
        partition.getPartitionKey('__bad__');
      }

      // -- TYPES -- //

      type EntryType = FirstParameter<typeof partition.toKeyPrefix>;
      type KeyPrefixReturnType = ReturnType<typeof partition.toKeyPrefix>;

      type _Tests = [
        // Should only accept registered entry names
        Expect<
          Equal<
            EntryType,
            | 'allConstants'
            | 'constantsWithVariable'
            | 'variableFirst'
            | 'singleConstant'
            | 'mixedPattern'
          >
        >,
        // Should return KeyValue type
        Expect<Equal<KeyPrefixReturnType, KeyValue>>,
      ];
    });
  });
});
