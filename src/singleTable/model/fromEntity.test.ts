/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtendableSingleTableEntity } from './definitions';
import { SingleTableFromEntityMethods } from './from/fromEntity/methods';
import { SingleTableSchema } from './schema';

type User = {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
};

const dynamodbProvider = {} as any;

const baseParams = {
  dynamodbProvider,
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

function paramsFor<T extends 'get'>(method: T) {
  return {
    ...baseParams,

    dynamodbProvider: {
      [method]: jest.fn(),
    } as any,
  };
}

function keyFor<T extends ExtendableSingleTableEntity>(
  entity: T,
  params: Parameters<T['getKey']>[0],
) {
  return {
    [baseParams.partitionKey]: (entity.getPartitionKey(params) as string[]).join('#'),
    [baseParams.rangeKey]: (entity.getRangeKey(params) as string[]).join('#'),
  };
}

describe('single table - from entity methods', () => {
  describe('get', () => {
    it('should work with entity partition key params [getter]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: ['USER', 'my-id'].join('#'),
          [baseParams.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity partition key params [key array]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: ['USER', 'my-id'].join('#'),
          [baseParams.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity range key params [getter]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USERS'],

        getRangeKey: ({ id }: Pick<User, 'id'>) => [id],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USERS',
          [baseParams.rangeKey]: 'my-id',
        },
      });
    });

    it('should work with entity range key params [key array]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USERS'],

        getRangeKey: ['.id'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USERS',
          [baseParams.rangeKey]: 'my-id',
        },
      });
    });

    it('should work with entity with no key params [getter]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USER'],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().get();

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USER',
          [baseParams.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity with no key params [key array]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER'],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().get();

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USER',
          [baseParams.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity with both key params [getter]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

        getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().get({ id, name });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: keyFor(user, { id, name }),
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().get();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().get({});

      // @ts-expect-error id should be required
      await instance.buildMethods().get({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().get({ id });
    });

    it('should work with entity with both key params [key array]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ['.name'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().get({ id, name });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: user.getPartitionKey({ id }).join('#'),
          [baseParams.rangeKey]: user.getRangeKey({ name }).join('#'),
        },
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().get();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().get({});

      // @ts-expect-error id should be required
      await instance.buildMethods().get({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().get({ id });
    });

    it('should work with mixed key params [getter + key array]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

        getRangeKey: ['.name'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().get({ id, name });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: user.getPartitionKey({ id }).join('#'),
          [baseParams.rangeKey]: user.getRangeKey({ name }).join('#'),
        },
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().get();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().get({});

      // @ts-expect-error id should be required
      await instance.buildMethods().get({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().get({ id });
    });

    it('should work with mixed key params [key array + getter]', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().get({ id, name });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: user.getPartitionKey({ id }).join('#'),
          [baseParams.rangeKey]: user.getRangeKey({ name }).join('#'),
        },
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().get();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().get({});

      // @ts-expect-error id should be required
      await instance.buildMethods().get({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().get({ id });
    });

    it('should forward config params', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().get({
        id: 'my-id',

        consistentRead: true,
        propertiesToRetrieve: ['name'],
      });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: user.getPartitionKey({ id: 'my-id' }).join('#'),
          [params.rangeKey]: user.getRangeKey().join('#'),
        },

        consistentRead: true,
        propertiesToRetrieve: ['name'],
      });
    });
  });

  describe('batch-get', () => {
    it('should properly get keys converted', async () => {
      const params = {
        dynamodbProvider,

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

      const batchGet = jest.fn().mockResolvedValue([]);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {
          batchGet,
        } as any,
      });

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }, { id: 'id4' }, { id: 'id5' }],
      });

      expect(batchGet).toHaveBeenCalled();
      expect(batchGet).toHaveBeenCalledWith({
        table: params.table,

        keys: [
          { [params.partitionKey]: 'USER#id1', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id2', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id3', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id4', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id5', [params.rangeKey]: '#DATA' },
        ],
      });
    });

    it('should forward config params', async () => {
      const params = {
        dynamodbProvider,

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

      const batchGet = jest.fn().mockResolvedValue([]);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {
          batchGet,
        } as any,
      });

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }, { id: 'id4' }, { id: 'id5' }],

        consistentRead: true,
        maxRetries: 5,
        propertiesToRetrieve: ['name'],
        throwOnUnprocessed: true,
      });

      expect(batchGet).toHaveBeenCalled();
      expect(batchGet).toHaveBeenCalledWith({
        table: params.table,

        keys: [
          { [params.partitionKey]: 'USER#id1', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id2', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id3', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id4', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id5', [params.rangeKey]: '#DATA' },
        ],

        consistentRead: true,
        maxRetries: 5,
        propertiesToRetrieve: ['name'],
        throwOnUnprocessed: true,
      });
    });
  });

  describe('delete', () => {
    it('should work with entity key params', async () => {
      const params = {
        dynamodbProvider,

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

      const deleteMock = jest.fn();

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {
          delete: deleteMock,
        } as any,
      });

      await instance.buildMethods().delete({
        id: 'my-id',
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: ['USER', 'my-id'].join('#'),
          [params.rangeKey]: '#DATA',
        },
      });
    });

    it('should forward config params', async () => {
      const params = {
        dynamodbProvider,

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

      const deleteMock = jest.fn();

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {
          delete: deleteMock,
        } as any,
      });

      await instance.buildMethods().delete({
        id: 'my-id',

        conditions: ['BAD_COD'] as any,
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: ['USER', 'my-id'].join('#'),
          [params.rangeKey]: '#DATA',
        },

        conditions: ['BAD_COD'] as any,
      });
    });
  });

  // Here we intercept the calls to verify just the missing part of the flow is working
  describe('create', () => {
    it('should user entity getCreationParams fn', async () => {
      // This fn is tested isolated, so we just need to tes that is the source of the params

      const params = {
        dynamodbProvider,

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

      const create = jest.fn();

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {
          create,
        } as any,
      });

      (instance as any).methods = {
        create,
      };

      const getCreationParams = jest.fn().mockReturnValue({
        item: 'here!',
      });

      user.getCreationParams = getCreationParams;

      const createUser = {
        address: 'add',
        createdAt: 'created',
        dob: 'dob',
        email: 'email',
        id: 'id',
        name: 'name',
      };

      await instance.buildMethods().create(createUser);

      expect(getCreationParams).toHaveBeenCalled();
      expect(getCreationParams).toHaveBeenCalledWith(createUser);
      expect(create).toHaveBeenCalled();
      expect(create).toHaveBeenCalledWith({
        item: 'here!',
      });
    });

    it('should forward second param for getCreationParams', async () => {
      // This fn is tested isolated, so we just need to tes that is the source of the params

      const params = {
        dynamodbProvider,

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

      const create = jest.fn();

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      (instance as any).methods = {
        create,
      };

      const getCreationParams = jest.fn().mockReturnValue({
        item: 'here!',
      });

      user.getCreationParams = getCreationParams;

      const createUser = {
        address: 'add',
        createdAt: 'created',
        dob: 'dob',
        email: 'email',
        id: 'id',
        name: 'name',
      };

      await instance.buildMethods().create(createUser, {
        expiresAt: 20234394,
      });

      expect(getCreationParams).toHaveBeenCalled();
      expect(getCreationParams).toHaveBeenCalledWith(createUser, {
        expiresAt: 20234394,
      });

      expect(create).toHaveBeenCalled();

      expect(create).toHaveBeenCalledWith({
        item: 'here!',
      });
    });
  });

  // Here we intercept the calls to verify just the missing part of the flow is working
  describe('update', () => {
    it('should user entity getUpdateParams fn', async () => {
      // This fn is tested isolated, so we just need to tes that is the source of the params

      const params = {
        dynamodbProvider,

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

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const update = jest.fn();

      (instance as any).methods = {
        update,
      };

      const getUpdateParams = jest.fn().mockReturnValue({
        update: 'here!',
      });

      user.getUpdateParams = getUpdateParams;

      const forwardParams = Symbol('update-params');

      await instance.buildMethods().update(forwardParams as any);

      expect(getUpdateParams).toHaveBeenCalled();
      expect(getUpdateParams).toHaveBeenCalledWith(forwardParams);

      expect(update).toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        update: 'here!',
      });
    });
  });

  describe('listing methods', () => {
    it('should not exist if no type-index is defined', () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const repo = instance.buildMethods();

      expect((repo as any).list).toBe(undefined);
      expect((repo as any).listAll).toBe(undefined);
    });

    it('listAll - should simply call listAllFromType from adaptor', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',

        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockReturn = ['MOCK_DATA'];

      const listAllFromType = jest.fn().mockResolvedValue(mockReturn);

      (instance as any).methods = {
        listAllFromType,
      };

      const result = await instance.buildMethods().listAll();

      expect(listAllFromType).toHaveBeenCalled();
      expect(listAllFromType).toHaveBeenCalledWith('USER');
      expect(result).toBe(mockReturn);
    });

    it('list - should simply call listType from adaptor', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',

        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = {
        items: ['FAKE'],
        paginationToken: '23',
      };

      const listType = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        listType,
      };

      const result = await instance.buildMethods().list();

      expect(listType).toHaveBeenCalled();
      expect(listType).toHaveBeenCalledWith({
        type: 'USER',
      });

      expect(result).toBe(mockResult);
    });

    it('list - should properly forward configs', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',

        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const listType = jest.fn();

      (instance as any).methods = {
        listType,
      };

      await instance.buildMethods().list({
        fullRetrieval: true,
        limit: 20,
        paginationToken: '1023',
        retrieveOrder: 'DESC',
        range: {
          operation: 'bigger_than',
          value: '2',
        },
      });

      expect(listType).toHaveBeenCalled();
      expect(listType).toHaveBeenCalledWith({
        type: 'USER',

        fullRetrieval: true,
        limit: 20,
        paginationToken: '1023',
        retrieveOrder: 'DESC',
        range: {
          operation: 'bigger_than',
          value: '2',
        },
      });
    });
  });

  describe('query methods', () => {
    it('should have a custom query', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.buildMethods().query.custom({
        id: 'my-id',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USER', 'my-id'],
      });

      expect(result).toBe(mockResult);
    });

    it('should forward custom query params', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.buildMethods().query.custom({
        id: 'my-id',

        filters: { some: 'filter' } as any,
        fullRetrieval: false,
        limit: 20,
        paginationToken: '2903',
        retrieveOrder: 'DESC',
        range: {
          operation: 'bigger_or_equal_than',
          value: 20,
        },
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USER', 'my-id'],

        filters: { some: 'filter' },
        fullRetrieval: false,
        limit: 20,
        paginationToken: '2903',
        retrieveOrder: 'DESC',
        range: {
          operation: 'bigger_or_equal_than',
          value: 20,
        },
      });

      expect(result).toBe(mockResult);
    });

    it('should have a query constructed from rangeQueries', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        rangeQueries: {
          someQuery: {
            operation: 'begins_with',
            getValues: () => ({
              value: '#DATA',
            }),
          },
        },
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const repo = instance.buildMethods();

      expect(repo.query.someQuery).toBeDefined();

      const result = await repo.query.someQuery({
        id: 'my-id',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USER', 'my-id'],

        range: {
          operation: 'begins_with',
          value: '#DATA',
        },
      });

      expect(result).toBe(mockResult);
    });

    it('should properly build range with params', async () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        rangeQueries: {
          someQuery: {
            operation: 'begins_with',
            getValues: ({ someValue }: { someValue: string }) => ({
              value: ['#DATA', someValue],
            }),
          },
        },
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const repo = instance.buildMethods();

      expect(repo.query.someQuery).toBeDefined();

      const result = await repo.query.someQuery({
        id: 'my-id',

        someValue: 'CUSTOM!',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USER', 'my-id'],

        range: {
          operation: 'begins_with',
          value: ['#DATA', 'CUSTOM!'],
        },
      });

      expect(result).toBe(mockResult);
    });
  });

  describe('query index methods', () => {
    it('should not exist if no index config is present', () => {
      const params = {
        dynamodbProvider,

        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const repo = instance.buildMethods();

      expect((repo as any).queryIndex).toBe(undefined);
    });

    it('should have a custom query on each index', async () => {
      const params = {
        dynamodbProvider,

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
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        indexes: {
          byEmail: {
            getPartitionKey: () => ['USERS_BY_EMAIL'],

            getRangeKey: ({ email }: { email: string }) => [email],

            index: 'anotherIndex',
          },

          byName: {
            getPartitionKey: () => ['USERS_BY_NAME'],

            getRangeKey: ({ name }: { name: string }) => [name],

            index: 'someIndex',
          },
        },
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.buildMethods().queryIndex.byEmail.custom();

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_EMAIL'],

        index: 'anotherIndex',
      });

      expect(result).toBe(mockResult);

      const result2 = await instance.buildMethods().queryIndex.byName.custom();

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_NAME'],

        index: 'someIndex',
      });

      expect(result2).toBe(mockResult);
    });

    it('should handle a custom query for an index partition with params', async () => {
      const params = {
        dynamodbProvider,

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
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        indexes: {
          byEmailProvider: {
            getPartitionKey: ({ email }: { email: string }) => [
              'USERS_BY_EMAIL_PROVIDER',
              email.split('@')[1],
            ],

            getRangeKey: ({ email }: { email: string }) => [email],

            index: 'anotherIndex',
          },
        },
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.buildMethods().queryIndex.byEmailProvider.custom({
        email: 'some@gmail.com',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],

        index: 'anotherIndex',
      });

      expect(result).toBe(mockResult);
    });

    it('should handle a range query with no params', async () => {
      const params = {
        dynamodbProvider,

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
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        indexes: {
          byEmailProvider: {
            getPartitionKey: ({ email }: { email: string }) => [
              'USERS_BY_EMAIL_PROVIDER',
              email.split('@')[1],
            ],

            getRangeKey: ({ email }: { email: string }) => [email],

            index: 'anotherIndex',

            rangeQueries: {
              aToF: {
                operation: `between`,
                getValues: () => ({
                  end: 'f',
                  start: 'a',
                }),
              },
            },
          },
        },
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.buildMethods().queryIndex.byEmailProvider.aToF({
        email: 'some@gmail.com',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],

        index: 'anotherIndex',

        range: {
          operation: 'between',
          end: 'f',
          start: 'a',
        },
      });

      expect(result).toBe(mockResult);
    });

    it('should handle a range query with params', async () => {
      const params = {
        dynamodbProvider,

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
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],

        indexes: {
          byEmailProvider: {
            getPartitionKey: ({ email }: { email: string }) => [
              'USERS_BY_EMAIL_PROVIDER',
              email.split('@')[1],
            ],

            getRangeKey: ({ email }: { email: string }) => [email],

            index: 'anotherIndex',

            rangeQueries: {
              startingWith: {
                operation: `begins_with`,
                getValues: ({ prefix }: { prefix: string }) => ({
                  value: prefix,
                }),
              },
            },
          },
        },
      });

      const instance = new SingleTableFromEntityMethods(user, {
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.buildMethods().queryIndex.byEmailProvider.startingWith({
        email: 'some@gmail.com',

        prefix: 'k',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],

        index: 'anotherIndex',

        range: {
          operation: 'begins_with',
          value: 'k',
        },
      });

      expect(result).toBe(mockResult);
    });
  });
});
