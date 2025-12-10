/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter, PrettifyObject } from 'types';
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
      const schema = new SingleTableSchema(tableConfig);

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
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
        },
      });

      expect(partition.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

      const user = partition.use('data').create<User>().entity({
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
    });

    it('should properly build entity from entry [partition params in entity + range params in entity]', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          firstLogin: ({ createdAt }: { createdAt: string }) => ['FIRST_LOGIN', createdAt],
        },
      });

      const firstLogin = partition.use('firstLogin').create<User>().entity({
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
    });

    it('should required _paramMatch_ build entity from entry [partition params NOT on entity + no range params]', () => {
      const schema = new SingleTableSchema(tableConfig);

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

      const createEntity = partition.use('data').create<User>().entity;

      const user = partition
        .use('data')
        .create<User>()
        .entity({
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

    it('[TYPES] Should only allow use() on registered entries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const { use } = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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
      const schema = new SingleTableSchema(tableConfig);

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
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
        },
      });

      const index = indexPartition.use('data').create<User>().index();

      expect(index.index).toBe('anotherIndex');

      expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

      expect(index.getRangeKey()).toStrictEqual(['#DATA']);

      expect(index.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });
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
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
        },
      });

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

      expect(index.getRangeKey()).toStrictEqual(['#DATA']);

      expect(index.getKey({ id: 'idd' })).toStrictEqual({
        partitionKey: ['USER', 'idd'],
        rangeKey: ['#DATA'],
      });
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
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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
  });
});
