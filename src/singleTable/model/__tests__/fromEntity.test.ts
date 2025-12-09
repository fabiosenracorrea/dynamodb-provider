/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal, PrettifyObject } from 'types';

import { SingleTableParams } from 'singleTable/adaptor';
import type { ExtendableSingleTableEntity } from '../definitions';
import { SingleTableFromEntityMethods } from '../from/fromEntity/methods';
import { SingleTableSchema } from '../schema';

interface User {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
}

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

function paramsFor<T extends 'get' | 'batchGet' | 'delete' | 'create' | 'update'>(
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

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: ['USER', 'my-id'].join('#'),
          [baseParams.rangeKey]: '#DATA',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});
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

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: ['USER', 'my-id'].join('#'),
          [baseParams.rangeKey]: '#DATA',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});
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

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USERS',
          [baseParams.rangeKey]: 'my-id',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});
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

      await instance.buildMethods().get({ id: 'my-id' });

      expect(params.dynamodbProvider.get).toHaveBeenCalled();
      expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USERS',
          [baseParams.rangeKey]: 'my-id',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().get();

      // @ts-expect-error id is required
      instance.buildMethods().get({});
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

    it('[TYPES] Return type should be Entity | undefined', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().get({ id: 'my-id' });

      type _R = Expect<Equal<typeof result, User | undefined>>;
    });

    it('[TYPES] Extend: Return type should be (Entity & extend) if _extend_ is provided', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],

        extend: () => ({
          newProperty: 10,
        }),
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().get({ id: 'my-id' });

      // User & { newProperty: number } requires PrettifyObj<>
      interface NewUser345 extends User {
        newProperty: number;
      }

      // @ts-expect-error User is not enough
      type _R = Expect<Equal<typeof result, User | undefined>>;

      type _R2 = Expect<Equal<typeof result, NewUser345 | undefined>>;
    });

    it('[TYPES] _propertiesToRetrieve_ only accepts existing props', async () => {
      const params = paramsFor('get');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      instance.buildMethods().get({
        id: 'my-id',

        propertiesToRetrieve: ['address', 'createdAt'],
      });

      instance.buildMethods().get({
        id: 'my-id',

        // @ts-expect-error no invalid props
        propertiesToRetrieve: ['invalid'],
      });
    });
  });

  describe('batch-get', () => {
    it('should work with entity partition key params [getter]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER#id1', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER#id2', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER#id3', [baseParams.rangeKey]: '#DATA' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error keys must have id
      instance.buildMethods().batchGet({ keys: [{}] });

      // @ts-expect-error id is required in each key
      instance.buildMethods().batchGet({ keys: [{ id: 'id1' }, {}] });
    });

    it('should work with entity partition key params [key array]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER#id1', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER#id2', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER#id3', [baseParams.rangeKey]: '#DATA' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error keys must have id
      instance.buildMethods().batchGet({ keys: [{}] });

      // @ts-expect-error id is required in each key
      instance.buildMethods().batchGet({ keys: [{ id: 'id1' }, {}] });
    });

    it('should work with entity range key params [getter]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USERS'],

        getRangeKey: ({ id }: Pick<User, 'id'>) => [id],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USERS', [baseParams.rangeKey]: 'id1' },
          { [baseParams.partitionKey]: 'USERS', [baseParams.rangeKey]: 'id2' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error keys must have id
      instance.buildMethods().batchGet({ keys: [{}] });
    });

    it('should work with entity range key params [key array]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USERS'],

        getRangeKey: ['.id'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USERS', [baseParams.rangeKey]: 'id1' },
          { [baseParams.partitionKey]: 'USERS', [baseParams.rangeKey]: 'id2' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error keys must have id
      instance.buildMethods().batchGet({ keys: [{}] });
    });

    it('should work with entity with no key params [getter]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USER'],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{}, {}, {}],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER', [baseParams.rangeKey]: '#DATA' },
        ],
      });
    });

    it('should work with entity with no key params [key array]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER'],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{}, {}, {}],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER', [baseParams.rangeKey]: '#DATA' },
          { [baseParams.partitionKey]: 'USER', [baseParams.rangeKey]: '#DATA' },
        ],
      });
    });

    it('should work with entity with both key params [getter]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

        getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [
          { id: 'id1', name: 'John' },
          { id: 'id2', name: 'Jane' },
        ],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER#id1', [baseParams.rangeKey]: 'John' },
          { [baseParams.partitionKey]: 'USER#id2', [baseParams.rangeKey]: 'Jane' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error id and name are required
      instance.buildMethods().batchGet({ keys: [{}] });

      // @ts-expect-error id is required
      instance.buildMethods().batchGet({ keys: [{ name: 'John' }] });

      // @ts-expect-error name is required
      instance.buildMethods().batchGet({ keys: [{ id: 'id1' }] });
    });

    it('should work with entity with both key params [key array]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ['.name'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [
          { id: 'id1', name: 'John' },
          { id: 'id2', name: 'Jane' },
        ],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER#id1', [baseParams.rangeKey]: 'John' },
          { [baseParams.partitionKey]: 'USER#id2', [baseParams.rangeKey]: 'Jane' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error id and name are required
      instance.buildMethods().batchGet({ keys: [{}] });

      // @ts-expect-error id is required
      instance.buildMethods().batchGet({ keys: [{ name: 'John' }] });

      // @ts-expect-error name is required
      instance.buildMethods().batchGet({ keys: [{ id: 'id1' }] });
    });

    it('should work with mixed key params [getter + key array]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

        getRangeKey: ['.name'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [
          { id: 'id1', name: 'John' },
          { id: 'id2', name: 'Jane' },
        ],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER#id1', [baseParams.rangeKey]: 'John' },
          { [baseParams.partitionKey]: 'USER#id2', [baseParams.rangeKey]: 'Jane' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error id and name are required
      instance.buildMethods().batchGet({ keys: [{}] });

      // @ts-expect-error id is required
      instance.buildMethods().batchGet({ keys: [{ name: 'John' }] });

      // @ts-expect-error name is required
      instance.buildMethods().batchGet({ keys: [{ id: 'id1' }] });
    });

    it('should work with mixed key params [key array + getter]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [
          { id: 'id1', name: 'John' },
          { id: 'id2', name: 'Jane' },
        ],
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: baseParams.table,

        keys: [
          { [baseParams.partitionKey]: 'USER#id1', [baseParams.rangeKey]: 'John' },
          { [baseParams.partitionKey]: 'USER#id2', [baseParams.rangeKey]: 'Jane' },
        ],
      });

      // --- TYPES --

      // @ts-expect-error id and name are required
      instance.buildMethods().batchGet({ keys: [{}] });

      // @ts-expect-error id is required
      instance.buildMethods().batchGet({ keys: [{ name: 'John' }] });

      // @ts-expect-error name is required
      instance.buildMethods().batchGet({ keys: [{ id: 'id1' }] });
    });

    it('should forward config params', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }],

        consistentRead: true,
        maxRetries: 5,
        propertiesToRetrieve: ['name'],
        throwOnUnprocessed: true,
      });

      expect(params.dynamodbProvider.batchGet).toHaveBeenCalled();
      expect(params.dynamodbProvider.batchGet).toHaveBeenCalledWith({
        table: params.table,

        keys: [
          { [params.partitionKey]: 'USER#id1', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id2', [params.rangeKey]: '#DATA' },
          { [params.partitionKey]: 'USER#id3', [params.rangeKey]: '#DATA' },
        ],

        consistentRead: true,
        maxRetries: 5,
        propertiesToRetrieve: ['name'],
        throwOnUnprocessed: true,
      });
    });

    it('[TYPES] Return type should be Entity[]', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }],
      });

      type _R = Expect<Equal<typeof result, User[]>>;
    });

    it('[TYPES] Extend: Return type should be (Entity & extend)[] if _extend_ is provided', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],

        extend: () => ({
          newProperty: 10,
        }),
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }],
      });

      interface NewUser456 extends User {
        newProperty: number;
      }

      // @ts-expect-error User is not enough
      type _R = Expect<Equal<typeof result, User[]>>;

      type _R2 = Expect<Equal<typeof result, NewUser456[]>>;
    });

    it('[TYPES] _propertiesToRetrieve_ only accepts existing props', async () => {
      const params = paramsFor('batchGet', []);

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }],

        propertiesToRetrieve: ['address', 'createdAt'],
      });

      instance.buildMethods().batchGet({
        keys: [{ id: 'id1' }],

        // @ts-expect-error no invalid props
        propertiesToRetrieve: ['invalid'],
      });
    });
  });

  describe('delete', () => {
    it('should work with entity partition key params [getter]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().delete({ id: 'my-id' });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: ['USER', 'my-id'].join('#'),
          [baseParams.rangeKey]: '#DATA',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().delete();

      // @ts-expect-error id is required
      instance.buildMethods().delete({});
    });

    it('should work with entity partition key params [key array]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().delete({ id: 'my-id' });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: ['USER', 'my-id'].join('#'),
          [baseParams.rangeKey]: '#DATA',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().delete();

      // @ts-expect-error id is required
      instance.buildMethods().delete({});
    });

    it('should work with entity range key params [getter]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USERS'],

        getRangeKey: ({ id }: Pick<User, 'id'>) => [id],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().delete({ id: 'my-id' });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USERS',
          [baseParams.rangeKey]: 'my-id',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().delete();

      // @ts-expect-error id is required
      instance.buildMethods().delete({});
    });

    it('should work with entity range key params [key array]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(baseParams);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USERS'],

        getRangeKey: ['.id'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().delete({ id: 'my-id' });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USERS',
          [baseParams.rangeKey]: 'my-id',
        },
      });

      // --- TYPES --

      // @ts-expect-error we have key params
      instance.buildMethods().delete();

      // @ts-expect-error id is required
      instance.buildMethods().delete({});
    });

    it('should work with entity with no key params [getter]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: () => ['USER'],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().delete();

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USER',
          [baseParams.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity with no key params [key array]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER'],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      await instance.buildMethods().delete();

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: 'USER',
          [baseParams.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity with both key params [getter]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

        getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().delete({ id, name });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: keyFor(user, { id, name }),
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().delete();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().delete({});

      // @ts-expect-error id should be required
      await instance.buildMethods().delete({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().delete({ id });
    });

    it('should work with entity with both key params [key array]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ['.name'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().delete({ id, name });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: user.getPartitionKey({ id }).join('#'),
          [baseParams.rangeKey]: user.getRangeKey({ name }).join('#'),
        },
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().delete();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().delete({});

      // @ts-expect-error id should be required
      await instance.buildMethods().delete({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().delete({ id });
    });

    it('should work with mixed key params [getter + key array]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

        getRangeKey: ['.name'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().delete({ id, name });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: user.getPartitionKey({ id }).join('#'),
          [baseParams.rangeKey]: user.getRangeKey({ name }).join('#'),
        },
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().delete();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().delete({});

      // @ts-expect-error id should be required
      await instance.buildMethods().delete({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().delete({ id });
    });

    it('should work with mixed key params [key array + getter]', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ['USER', '.id'],

        getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const id = 'my-id';
      const name = 'my-name';

      await instance.buildMethods().delete({ id, name });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: baseParams.table,

        key: {
          [baseParams.partitionKey]: user.getPartitionKey({ id }).join('#'),
          [baseParams.rangeKey]: user.getRangeKey({ name }).join('#'),
        },
      });

      // --- TYPES --

      // @ts-expect-error params should be required
      await instance.buildMethods().delete();

      // @ts-expect-error id,name should be required
      await instance.buildMethods().delete({});

      // @ts-expect-error id should be required
      await instance.buildMethods().delete({ name });

      // @ts-expect-error name should be required
      await instance.buildMethods().delete({ id });
    });

    it('should forward config params (conditions)', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const conditionsSymbol = Symbol('conditions-untouched') as any;

      await instance.buildMethods().delete({
        id: 'my-id',

        conditions: conditionsSymbol,
      });

      expect(params.dynamodbProvider.delete).toHaveBeenCalled();
      expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: user.getPartitionKey({ id: 'my-id' }).join('#'),
          [params.rangeKey]: user.getRangeKey().join('#'),
        },

        conditions: conditionsSymbol,
      });
    });

    it('[TYPES] conditions should ensure existing prop references', async () => {
      const params = paramsFor('delete');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      instance.buildMethods().delete({
        id: 'my-id',

        conditions: [
          {
            property: 'address',
            operation: 'begins_with',
            value: 1,
            nested: [
              {
                property: 'createdAt',
                operation: 'between',
                start: '1',
                end: '2',
                joinAs: 'or',
              },
            ],
          },

          // @ts-expect-error no non-existing property reference
          { property: 'INVALID', operation: 'begins_with', value: 1 },
        ],
      });
    });
  });

  // Here we intercept the calls to verify just the missing part of the flow is working
  // getCreationParams is tested in isolation in definitions/entity/crud.spec.ts
  describe('create', () => {
    it("should use entity's getCreationParams fn", async () => {
      const params = paramsFor('create', {});

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const create = jest.fn();
      (instance as any).methods = { create };

      const getCreationParams = jest.fn().mockReturnValue({
        item: 'mocked-result',
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

      expect(getCreationParams).toHaveBeenCalledTimes(1);
      expect(getCreationParams).toHaveBeenCalledWith(createUser);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        item: 'mocked-result',
      });
    });

    it('should forward second param (expiresAt) to getCreationParams', async () => {
      const params = paramsFor('create', {});

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const create = jest.fn();
      (instance as any).methods = { create };

      const getCreationParams = jest.fn().mockReturnValue({
        item: 'mocked-result',
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

      const configSymbol = Symbol('config-untouched') as any;

      await instance.buildMethods().create(createUser, configSymbol);

      expect(getCreationParams).toHaveBeenCalledTimes(1);
      expect(getCreationParams).toHaveBeenCalledWith(createUser, configSymbol);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        item: 'mocked-result',
      });
    });

    it('[TYPES] Input type should be Entity', async () => {
      const params = paramsFor('create', {});

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const createFn = instance.buildMethods().create;

      type Input1 = PrettifyObject<Parameters<typeof createFn>[0]>;

      type _R = Expect<Equal<Input1, User>>;
    });

    it('[TYPES] Return type should be Entity', async () => {
      const params = paramsFor('create', {});

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().create({
        address: 'add',
        createdAt: 'created',
        dob: 'dob',
        email: 'email',
        id: 'id',
        name: 'name',
      });

      type _R = Expect<Equal<typeof result, User>>;
    });

    it('[TYPES] Extend: Return type should be (Entity & extend) if _extend_ is provided', async () => {
      const params = paramsFor('create', {});

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],

        extend: () => ({
          newProperty: 10,
        }),
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const createUser: User = {
        address: 'add',
        createdAt: 'created',
        dob: 'dob',
        email: 'email',
        id: 'id',
        name: 'name',
      };

      const result = await instance.buildMethods().create(createUser);

      interface NewUser567 extends User {
        newProperty: number;
      }

      // @ts-expect-error User is not enough
      type _R = Expect<Equal<typeof result, User>>;

      type _R2 = Expect<Equal<typeof result, NewUser567>>;
    });

    it('[TYPES] expiresAt parameter should only be available when table has expiresAt configured', async () => {
      const paramsWithExpires = paramsFor('create', {});

      const schema = new SingleTableSchema(paramsWithExpires);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, paramsWithExpires);

      const createUser: User = {
        address: 'add',
        createdAt: 'created',
        dob: 'dob',
        email: 'email',
        id: 'id',
        name: 'name',
      };

      // Should work with expiresAt when table has it configured
      instance.buildMethods().create(createUser, { expiresAt: 123456 });

      const { expiresAt: _, ...paramsWithoutExpires } = paramsWithExpires;

      const schemaNoExpires = new SingleTableSchema(paramsWithoutExpires);

      const userNoExpires = schemaNoExpires.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instanceNoExpires = new SingleTableFromEntityMethods(
        userNoExpires,
        paramsWithoutExpires,
      );

      // @ts-expect-error expiresAt should not be available when table doesn't have it configured
      instanceNoExpires.buildMethods().create(createUser, { expiresAt: 123456 });
    });
  });

  // Here we intercept the calls to verify just the missing part of the flow is working
  // getUpdateParams is tested in isolation in definitions/entity/crud.spec.ts
  describe('update', () => {
    it("should use entity's getUpdateParams fn", async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const update = jest.fn();
      (instance as any).methods = { update };

      const getUpdateParams = jest.fn().mockReturnValue({
        mocked: 'update-result',
      });

      user.getUpdateParams = getUpdateParams;

      const forwardParams = Symbol('update-params') as any;

      await instance.buildMethods().update(forwardParams);

      expect(getUpdateParams).toHaveBeenCalledTimes(1);
      expect(getUpdateParams).toHaveBeenCalledWith(forwardParams);

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith({
        mocked: 'update-result',
      });
    });

    it('[TYPES] Input type should require key params + update operations', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const updateFn = instance.buildMethods().update;

      type Input = PrettifyObject<Parameters<typeof updateFn>[0]>;

      // Should require id from key params
      type _HasId = Expect<Equal<Input['id'], string>>;

      // Should accept update operations
      updateFn({
        id: 'user-id',
        values: { name: 'New Name' },
      });

      updateFn({
        id: 'user-id',
        remove: ['email'],
      });

      updateFn({
        id: 'user-id',
        atomicOperations: [{ type: 'add', property: 'updatedAt', value: 1 }],
      });

      // @ts-expect-error id is required
      updateFn({});

      // @ts-expect-error id is required
      updateFn({ values: { name: 'Test' } });
    });

    it('[TYPES] Return type should be void if no _returnUpdatedProps_', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().update({
        id: 'user-id',
        values: { name: 'New Name' },
      });

      type _R = Expect<Equal<typeof result, void>>;
    });

    it('[TYPES] Extend: Return type infer _values_ properties', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().update({
        id: 'user-id',
        values: { name: 'New Name', address: '298032' },
        returnUpdatedProperties: true,
      });

      // @ts-expect-error Should be narrow...
      type _R = Expect<Equal<typeof result, Partial<User>>>;

      // @ts-expect-error Should be defined...
      type _R2 = Expect<Equal<typeof result, void>>;

      type Expected = { name: string; address: string };

      type _R3 = Expect<Equal<typeof result, Expected>>;
    });

    it('[TYPES] Extend: Return type infer _atomicOperations_ properties', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().update({
        id: 'user-id',
        returnUpdatedProperties: true,
        atomicOperations: [{ property: 'email', type: 'sum', value: 1 }],
      });

      // @ts-expect-error Should be narrow...
      type _R = Expect<Equal<typeof result, Partial<User>>>;

      // @ts-expect-error Should be defined...
      type _R2 = Expect<Equal<typeof result, void>>;

      type Expected = { email: string };

      type _R3 = Expect<Equal<typeof result, Expected>>;
    });

    it('[TYPES] Extend: Return type infer _atomicOperations_ AND _values_ properties', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const result = await instance.buildMethods().update({
        id: 'user-id',
        returnUpdatedProperties: true,
        atomicOperations: [{ property: 'email', type: 'sum', value: 1 }],
        values: { name: '92839' },
      });

      // @ts-expect-error Should be narrow...
      type _R = Expect<Equal<typeof result, Partial<User>>>;

      // @ts-expect-error Should be defined...
      type _R2 = Expect<Equal<typeof result, void>>;

      type Expected = { email: string; name: string };

      type _R3 = Expect<Equal<typeof result, Expected>>;
    });

    it('[TYPES] expiresAt parameter should only be available when table has expiresAt configured', async () => {
      const paramsWithExpires = paramsFor('update');

      const schema = new SingleTableSchema(paramsWithExpires);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, paramsWithExpires);

      // Should work with expiresAt when table has it configured
      const updaterExpires = instance.buildMethods().update;

      type InputExpires = Parameters<typeof updaterExpires>[0];

      type ExpiresKey = Extract<keyof InputExpires, 'expiresAt'>;

      type _R = Expect<Equal<ExpiresKey, never>>;

      const { expiresAt: _, ...paramsWithoutExpires } = paramsWithExpires;

      const schemaNoExpires = new SingleTableSchema(paramsWithoutExpires);

      const userNoExpires = schemaNoExpires.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instanceNoExpires = new SingleTableFromEntityMethods(
        userNoExpires,
        paramsWithoutExpires,
      );

      const updaterNoExpires = instanceNoExpires.buildMethods().update;

      type InputNoExpires = Parameters<typeof updaterNoExpires>[0];

      type NoExpiresKey = Extract<keyof InputNoExpires, 'expiresAt'>;

      type _R2 = Expect<Equal<NoExpiresKey, never>>;
    });

    it('[TYPES] values should only accept existing entity properties', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // Valid properties
      instance.buildMethods().update({
        id: 'user-id',
        values: { name: 'Test', email: 'test@example.com' },
      });

      instance.buildMethods().update({
        id: 'user-id',
        // @ts-expect-error invalid property
        values: { invalidProp: 'Test' },
      });
    });

    it('[TYPES] remove should only accept existing entity properties', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // Valid properties
      instance.buildMethods().update({
        id: 'user-id',
        remove: ['email', 'address'],
      });

      instance.buildMethods().update({
        id: 'user-id',
        // @ts-expect-error invalid property
        remove: ['invalidProp'],
      });
    });

    it('[TYPES] atomicOperations property should only accept existing entity properties', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      // Valid properties - using 'as any' for value since atomic operations have specific type requirements
      instance.buildMethods().update({
        id: 'user-id',
        atomicOperations: [{ type: 'add', property: 'updatedAt', value: 1 as any }],
      });

      instance.buildMethods().update({
        id: 'user-id',
        atomicOperations: [
          // @ts-expect-error invalid property
          { type: 'add', property: 'invalidProp', value: 1 },
        ],
      });
    });

    it('[TYPES] conditions should ensure existing prop references', async () => {
      const params = paramsFor('update');

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      instance.buildMethods().update({
        id: 'user-id',
        values: { name: 'Test' },

        conditions: [
          {
            property: 'address',
            operation: 'begins_with',
            value: '123',
            nested: [
              {
                property: 'createdAt',
                operation: 'between',
                start: '1',
                end: '2',
                joinAs: 'or',
              },
            ],
          },

          // @ts-expect-error no non-existing property reference
          { property: 'INVALID', operation: 'begins_with', value: '1' },
        ],
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

      const instance = new SingleTableFromEntityMethods(user, params);

      const repo = instance.buildMethods();

      expect((repo as any).list).toBe(undefined);
      expect((repo as any).listAll).toBe(undefined);
    });

    describe('listAll', () => {
      it('should call listAllFromType from adaptor', async () => {
        const mockReturn = [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ];

        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listAllFromType = jest.fn().mockResolvedValue(mockReturn);
        (instance as any).methods = { listAllFromType };

        const result = await instance.buildMethods().listAll();

        expect(listAllFromType).toHaveBeenCalledTimes(1);
        expect(listAllFromType).toHaveBeenCalledWith('USER');
        expect(result).toBe(mockReturn);
      });

      it('[TYPES] Return type should be Entity[]', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listAllFromType = jest.fn().mockResolvedValue([]);
        (instance as any).methods = { listAllFromType };

        const result = await instance.buildMethods().listAll();

        type _R = Expect<Equal<typeof result, User[]>>;
      });

      it('[TYPES] Extend: Return type should be (Entity & extend)[] if _extend_ is provided', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listAllFromType = jest.fn().mockResolvedValue([]);
        (instance as any).methods = { listAllFromType };

        const result = await instance.buildMethods().listAll();

        interface NewUser678 extends User {
          newProperty: number;
        }

        // @ts-expect-error User is not enough
        type _R = Expect<Equal<typeof result, User[]>>;

        type _R2 = Expect<Equal<typeof result, NewUser678[]>>;
      });
    });

    describe('list', () => {
      it('should work with no params', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const mockResult = {
          items: [],
          paginationToken: '',
        };

        const listType = jest.fn().mockResolvedValue(mockResult);
        (instance as any).methods = { listType };

        const result = await instance.buildMethods().list();

        expect(listType).toHaveBeenCalledTimes(1);
        expect(listType).toHaveBeenCalledWith({
          type: 'USER',
        });
        expect(result).toBe(mockResult);
      });

      it('should call listType from adaptor with basic params', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const mockResult = {
          items: [{ id: '1', name: 'User 1' }],
          paginationToken: '23',
        };

        const listType = jest.fn().mockResolvedValue(mockResult);
        (instance as any).methods = { listType };

        const result = await instance.buildMethods().list();

        expect(listType).toHaveBeenCalledTimes(1);
        expect(listType).toHaveBeenCalledWith({
          type: 'USER',
        });
        expect(result).toBe(mockResult);
      });

      it('should forward range query params', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listType = jest.fn().mockResolvedValue({ items: [], paginationToken: '' });
        (instance as any).methods = { listType };

        const rangeSymbol = Symbol('range-no-modify') as any;

        await instance.buildMethods().list({
          range: rangeSymbol,
        });

        expect(listType).toHaveBeenCalledWith({
          type: 'USER',
          range: rangeSymbol,
        });
      });

      it('should properly forward all config params', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listType = jest.fn().mockResolvedValue({ items: [], paginationToken: '' });
        (instance as any).methods = { listType };

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

        expect(listType).toHaveBeenCalledTimes(1);
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

      it('[TYPES] Return type should be ListEntityResult<Entity>', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listType = jest.fn().mockResolvedValue({ items: [], paginationToken: '' });
        (instance as any).methods = { listType };

        const result = await instance.buildMethods().list();

        type _E = { items: User[]; paginationToken: string };

        type _R = Expect<Equal<typeof result, _E>>;
      });

      it('[TYPES] Extend: Return type items should be (Entity & extend)[]', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listType = jest.fn().mockResolvedValue({ items: [], paginationToken: '' });
        (instance as any).methods = { listType };

        const result = await instance.buildMethods().list();

        interface NewUser789 extends User {
          newProperty: number;
        }

        // @ts-expect-error User is not enough
        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken: string }>>;

        type _R2 = Expect<Equal<typeof result, { items: NewUser789[]; paginationToken: string }>>;
      });

      it('[TYPES] params should be optional', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listType = jest.fn().mockResolvedValue({ items: [], paginationToken: '' });
        (instance as any).methods = { listType };

        // Should work without params
        instance.buildMethods().list();

        // Should work with params
        instance.buildMethods().list({ limit: 10 });
      });

      it('[TYPES] range operations should be typed correctly', async () => {
        const params = {
          ...baseParams,
          dynamodbProvider: {} as any,
        };

        const schema = new SingleTableSchema(params);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const instance = new SingleTableFromEntityMethods(user, params);

        const listType = jest.fn().mockResolvedValue({ items: [], paginationToken: '' });
        (instance as any).methods = { listType };

        // Valid operations
        instance.buildMethods().list({
          range: { operation: 'bigger_than', value: '1' },
        });

        instance.buildMethods().list({
          range: { operation: 'lower_than', value: '1' },
        });

        instance.buildMethods().list({
          range: { operation: 'bigger_or_equal_than', value: '1' },
        });

        instance.buildMethods().list({
          range: { operation: 'lower_or_equal_than', value: '1' },
        });

        instance.buildMethods().list({
          range: { operation: 'between', start: 'a', end: 'z' },
        });

        instance.buildMethods().list({
          // @ts-expect-error invalid operation
          range: { operation: 'invalid_operation', value: '1' },
        });

        instance.buildMethods().list({
          // @ts-expect-error begins_with is not allowed in list range
          range: { operation: 'begins_with', value: '1' },
        });
      });
    });
  });

  describe('query methods', () => {
    function queryInstance<
      T extends ExtendableSingleTableEntity,
      Params extends SingleTableParams | undefined,
    >(entity: T, params?: Params) {
      const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

      const result = { items: [], paginationToken: '' };

      const query = jest.fn().mockResolvedValue(result);
      (instance as any).methods = { query };

      return { instance, query, expectedResult: result };
    }

    describe('custom', () => {
      it('should work with entity partition key params [getter]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().query.custom({
          id: 'my-id',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
        });
        expect(result).toEqual(expectedResult);

        // --- TYPES ---

        // @ts-expect-error id is required
        await instance.buildMethods().query.custom();

        // @ts-expect-error id is required
        await instance.buildMethods().query.custom({});

        // Should work with id
        await instance.buildMethods().query.custom({ id: 'my-id' });
      });

      it('should work with entity partition key params [key array]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ['USER', '.id'],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().query.custom({
          id: 'my-id',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
        });
        expect(result).toEqual(expectedResult);

        // --- TYPES ---

        // @ts-expect-error id is required
        await instance.buildMethods().query.custom();

        // @ts-expect-error id is required
        await instance.buildMethods().query.custom({});

        // Should work with id
        await instance.buildMethods().query.custom({ id: 'my-id' });
      });

      it('should work with entity with no key params [getter]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().query.custom();

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS'],
        });
        expect(result).toEqual(expectedResult);
      });

      it('should work with entity with no key params [key array]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ['USERS'],
          getRangeKey: ['#DATA'],
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().query.custom();

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS'],
        });
        expect(result).toEqual(expectedResult);
      });

      it('should forward range param', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, query } = queryInstance(user);

        await instance.buildMethods().query.custom({
          id: 'my-id',
          range: {
            operation: 'begins_with',
            value: 'PREFIX',
          },
        });

        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: 'PREFIX',
          },
        });
      });

      it('should forward all query config params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, query } = queryInstance(user);

        await instance.buildMethods().query.custom({
          id: 'my-id',
          filters: { name: 'John' },
          fullRetrieval: false,
          limit: 20,
          paginationToken: '2903',
          retrieveOrder: 'DESC',
          range: {
            operation: 'bigger_or_equal_than',
            value: '100',
          },
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          filters: { name: 'John' },
          fullRetrieval: false,
          limit: 20,
          paginationToken: '2903',
          retrieveOrder: 'DESC',
          range: {
            operation: 'bigger_or_equal_than',
            value: '100',
          },
        });
      });

      it('[TYPES] Return type should be QueryResult<Entity>', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().query.custom({ id: 'my-id' });

        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;
      });

      it('[TYPES] Extend: Return type should include extended properties', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().query.custom({ id: 'my-id' });

        interface NewUser890 extends User {
          newProperty: number;
        }

        // @ts-expect-error User is not enough
        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;

        type _R2 = Expect<Equal<typeof result, { items: NewUser890[]; paginationToken?: string }>>;
      });

      it('[TYPES] range operations should be typed correctly', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryInstance(user);

        // Valid operations
        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'equal', value: '1' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'bigger_than', value: '1' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'lower_than', value: '1' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'bigger_or_equal_than', value: '1' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'lower_or_equal_than', value: '1' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'begins_with', value: 'prefix' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          range: { operation: 'between', start: 'a', end: 'z' },
        });

        instance.buildMethods().query.custom({
          id: 'my-id',
          // @ts-expect-error invalid operation
          range: { operation: 'invalid_operation', value: '1' },
        });
      });
    });

    describe('rangeQueries', () => {
      it('should have queries from rangeQueries definition [partition getter + no range query params]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
              getValues: () => ({ value: '#DATA' }),
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        const result = await repo.query.someQuery({ id: 'my-id' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: '#DATA',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params with id is required
        repo.query.someQuery();

        // @ts-expect-error params with id is required
        repo.query.someQuery({});
      });

      it('should have queries from rangeQueries definition [partition array + no range query params]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ['USER', '.id'],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
              getValues: () => ({ value: '#DATA' }),
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        const result = await repo.query.someQuery({ id: 'my-id' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: '#DATA',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params with id is required
        repo.query.someQuery();

        // @ts-expect-error params with id is required
        repo.query.someQuery({});
      });

      it('should have queries from rangeQueries definition [partition getter + with range query params]', async () => {
        const schema = new SingleTableSchema(baseParams);

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

        const { instance, query } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        await repo.query.someQuery({ id: 'my-id', someValue: 'CUSTOM!' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: ['#DATA', 'CUSTOM!'],
          },
        });

        // --- TYPES ---

        // @ts-expect-error params with id/someValue is required
        repo.query.someQuery();

        // @ts-expect-error id/someValue is required
        repo.query.someQuery({});

        // @ts-expect-error id is required
        repo.query.someQuery({ someValue: '2390' });

        // @ts-expect-error someValue is required
        repo.query.someQuery({ id: '2390' });
      });

      it('should have queries from rangeQueries definition [partition array + with range query params]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ['USER', '.id'],
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

        const { instance, query } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        await repo.query.someQuery({ id: 'my-id', someValue: 'CUSTOM!' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: ['#DATA', 'CUSTOM!'],
          },
        });

        // --- TYPES ---

        // @ts-expect-error params with id/someValue is required
        repo.query.someQuery();

        // @ts-expect-error id/someValue is required
        repo.query.someQuery({});

        // @ts-expect-error id is required
        repo.query.someQuery({ someValue: '2390' });

        // @ts-expect-error someValue is required
        repo.query.someQuery({ id: '2390' });
      });

      it('[basic ranges] should have default values if _getValues_ is not provided [getter key]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        const result = await repo.query.someQuery({ value: '#DATA', id: 'my-id' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: '#DATA',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params with id/value is required
        repo.query.someQuery();

        // @ts-expect-error id/value is required
        repo.query.someQuery({});

        // @ts-expect-error id is required
        repo.query.someQuery({ value: '11' });

        // @ts-expect-error value is required
        repo.query.someQuery({ id: '11' });
      });

      it('[between ranges] should have default values if _getValues_ is not provided [getter key]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'between',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        const result = await repo.query.someQuery({ start: 'start', end: 'end', id: 'my-id' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'between',
            start: 'start',
            end: 'end',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params with id/start/end is required
        repo.query.someQuery();

        // @ts-expect-error id/start/end is required
        repo.query.someQuery({});

        // @ts-expect-error id/end is required
        repo.query.someQuery({ start: '11' });

        // @ts-expect-error start/end is required
        repo.query.someQuery({ id: '11' });

        // @ts-expect-error start/id is required
        repo.query.someQuery({ end: '11' });
      });

      it('[basic ranges] should have default values if _getValues_ is not provided [array key]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ['USER', '.id'],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        const result = await repo.query.someQuery({ value: '#DATA', id: 'my-id' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: '#DATA',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params with id/value is required
        repo.query.someQuery();

        // @ts-expect-error id/value is required
        repo.query.someQuery({});

        // @ts-expect-error id is required
        repo.query.someQuery({ value: '11' });

        // @ts-expect-error value is required
        repo.query.someQuery({ id: '11' });
      });

      it('[between ranges] should have default values if _getValues_ is not provided [array key]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ['USER', '.id'],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'between',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const repo = instance.buildMethods();
        expect(repo.query.someQuery).toBeDefined();

        const result = await repo.query.someQuery({ start: 'start', end: 'end', id: 'my-id' });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'between',
            start: 'start',
            end: 'end',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params with id/start/end is required
        repo.query.someQuery();

        // @ts-expect-error id/start/end is required
        repo.query.someQuery({});

        // @ts-expect-error id/end is required
        repo.query.someQuery({ start: '11' });

        // @ts-expect-error start/end is required
        repo.query.someQuery({ id: '11' });

        // @ts-expect-error start/id is required
        repo.query.someQuery({ end: '11' });
      });

      it('should forward query config params in rangeQueries', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
              getValues: () => ({ value: '#DATA' }),
            },
          },
        });

        const { instance, query } = queryInstance(user);

        const params = {
          limit: 10,
          retrieveOrder: 'DESC' as const,
          fullRetrieval: true,
          paginationToken: '230923',
          filters: Symbol('unique-filters') as any,
        };

        await instance.buildMethods().query.someQuery({
          id: 'my-id',
          ...params,
        });

        expect(query).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          range: {
            operation: 'begins_with',
            value: '#DATA',
          },
          ...params,
        });
      });

      it('[TYPES] Return type should be QueryResult<Entity>', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
              getValues: () => ({ value: '#DATA' }),
            },
          },
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().query.someQuery({ id: 'my-id' });

        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;
      });

      it('[TYPES] Extend: Return type should include extended properties', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
          rangeQueries: {
            someQuery: {
              operation: 'begins_with',
              getValues: () => ({ value: '#DATA' }),
            },
          },
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().query.someQuery({ id: 'my-id' });

        interface NewUser901 extends User {
          newProperty: number;
        }

        // @ts-expect-error User is not enough
        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;

        type _R2 = Expect<Equal<typeof result, { items: NewUser901[]; paginationToken?: string }>>;
      });
    });
  });

  describe('query index methods', () => {
    function queryInstance<
      T extends ExtendableSingleTableEntity,
      Params extends SingleTableParams | undefined,
    >(entity: T, params?: Params) {
      const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

      const result = { items: [], paginationToken: '' };

      const query = jest.fn().mockResolvedValue(result);
      (instance as any).methods = { query };

      return { instance, query, expectedResult: result };
    }

    it('should not exist if no index config is present', () => {
      const params = {
        ...baseParams,
        dynamodbProvider: {} as any,
      };

      const schema = new SingleTableSchema(params);

      const user = schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        getRangeKey: () => ['#DATA'],
      });

      const instance = new SingleTableFromEntityMethods(user, params);

      const repo = instance.buildMethods();

      expect((repo as any).queryIndex).toBe(undefined);
    });

    describe('custom', () => {
      it('should work with index partition key params [getter]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailProvider: {
              getPartitionKey: ({ email }: { email: string }) => [
                'USERS_BY_EMAIL_PROVIDER',
                email?.split('@')?.[1],
              ],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmailProvider.custom({
          email: 'test@gmail.com',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.custom();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.custom({});
      });

      it('should work with index partition key params [key array]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: ['USERS_BY_EMAIL', '.email'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.custom({
          email: 'test@example.com',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL', 'test@example.com'],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.custom();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.custom({});
      });

      it('should work with index with no key params [getter]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byStatus: {
              getPartitionKey: () => ['USERS_BY_STATUS'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byStatus.custom();

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_STATUS'],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);
      });

      it('should work with index with no key params [key array]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byStatus: {
              getPartitionKey: ['USERS_BY_STATUS'],
              getRangeKey: ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byStatus.custom();

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_STATUS'],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);
      });

      it('should work with index with both key params [getter]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailName: {
              getPartitionKey: ({ email }: Pick<User, 'email'>) => ['BY_EMAIL', email],
              getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const email = 'test@example.com';

        const result = await instance.buildMethods().queryIndex.byEmailName.custom({
          email,
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['BY_EMAIL', email],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params should be required
        instance.buildMethods().queryIndex.byEmailName.custom();

        // @ts-expect-error email should be required
        instance.buildMethods().queryIndex.byEmailName.custom({});
      });

      it('should work with index with both key params [key array]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailName: {
              getPartitionKey: ['BY_EMAIL', '.email'],
              getRangeKey: ['.name'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const email = 'test@example.com';
        const name = 'John';

        const result = await instance.buildMethods().queryIndex.byEmailName.custom({
          email,
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['BY_EMAIL', email],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params should be required
        instance.buildMethods().queryIndex.byEmailName.custom();

        // @ts-expect-error email should be required
        instance.buildMethods().queryIndex.byEmailName.custom({});

        // @ts-expect-error email should be required
        instance.buildMethods().queryIndex.byEmailName.custom({ name });
      });

      it('should work with index mixed key params [getter + key array]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailName: {
              getPartitionKey: ({ email }: Pick<User, 'email'>) => ['BY_EMAIL', email],
              getRangeKey: ['.name'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const email = 'test@example.com';

        const result = await instance.buildMethods().queryIndex.byEmailName.custom({
          email,
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['BY_EMAIL', email],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params should be required
        instance.buildMethods().queryIndex.byEmailName.custom();

        // @ts-expect-error email should be required
        instance.buildMethods().queryIndex.byEmailName.custom({});
      });

      it('should work with index mixed key params [key array + getter]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailName: {
              getPartitionKey: ['BY_EMAIL', '.email'],
              getRangeKey: ({ name }: Pick<User, 'name'>) => [name],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const email = 'test@example.com';

        const result = await instance.buildMethods().queryIndex.byEmailName.custom({
          email,
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['BY_EMAIL', email],
          index: 'anotherIndex',
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error params should be required
        instance.buildMethods().queryIndex.byEmailName.custom();

        // @ts-expect-error email should be required
        instance.buildMethods().queryIndex.byEmailName.custom({});
      });

      it('should forward all query config params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance, query } = queryInstance(user);

        await instance.buildMethods().queryIndex.byEmail.custom({
          filters: { name: 'John' },
          fullRetrieval: false,
          limit: 20,
          paginationToken: '2903',
          retrieveOrder: 'DESC',
          range: {
            operation: 'begins_with',
            value: 'test@',
          },
        });

        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL'],
          index: 'anotherIndex',
          filters: { name: 'John' },
          fullRetrieval: false,
          limit: 20,
          paginationToken: '2903',
          retrieveOrder: 'DESC',
          range: {
            operation: 'begins_with',
            value: 'test@',
          },
        });
      });

      it('[TYPES] Return type should be QueryResult<Entity>', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.custom();

        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;
      });

      it('[TYPES] Extend: Return type should include extended properties', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.custom();

        interface NewUser912 extends User {
          newProperty: number;
        }

        // @ts-expect-error User is not enough
        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;

        type _R2 = Expect<Equal<typeof result, { items: NewUser912[]; paginationToken?: string }>>;
      });

      it('[TYPES] range operations should be typed correctly', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
            },
          },
        });

        const { instance } = queryInstance(user);

        // Valid operations
        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'equal', value: '1' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'bigger_than', value: '1' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'lower_than', value: '1' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'bigger_or_equal_than', value: '1' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'lower_or_equal_than', value: '1' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'begins_with', value: 'prefix' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          range: { operation: 'between', start: 'a', end: 'z' },
        });

        instance.buildMethods().queryIndex.byEmail.custom({
          // @ts-expect-error invalid operation
          range: { operation: 'invalid_operation', value: '1' },
        });
      });
    });

    describe('rangeQueries', () => {
      it('should handle range query with index partition params [getter] + no range query params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailProvider: {
              getPartitionKey: ({ email }: { email: string }) => [
                'USERS_BY_EMAIL_PROVIDER',
                email?.split?.('@')?.[1],
              ],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                aToF: {
                  operation: 'between',
                  getValues: () => ({ end: 'f', start: 'a' }),
                },
              },
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmailProvider.aToF({
          email: 'some@gmail.com',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],
          index: 'anotherIndex',
          range: {
            operation: 'between',
            end: 'f',
            start: 'a',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.aToF();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.aToF({});
      });

      it('should handle range query with index partition params [key array] + no range query params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: ['USERS_BY_EMAIL', '.email'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                aToF: {
                  operation: 'between',
                  getValues: () => ({ end: 'f', start: 'a' }),
                },
              },
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.aToF({
          email: 'test@example.com',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL', 'test@example.com'],
          index: 'anotherIndex',
          range: {
            operation: 'between',
            end: 'f',
            start: 'a',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.aToF();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.aToF({});
      });

      it('should handle range query with index partition params [getter] + no _getValues_ params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailProvider: {
              getPartitionKey: ({ email }: { email: string }) => [
                'USERS_BY_EMAIL_PROVIDER',
                email?.split?.('@')?.[1],
              ],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                prefix: {
                  operation: 'begins_with',
                },
              },
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmailProvider.prefix({
          email: 'some@gmail.com',
          value: 'a',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],
          index: 'anotherIndex',
          range: {
            operation: 'begins_with',
            value: 'a',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.prefix();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.prefix({});

        // @ts-expect-error value is required
        instance.buildMethods().queryIndex.byEmailProvider.prefix({ email: 'q' });
      });

      it('should handle range query with index partition params [key array] + no _getValues_ params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: ['USERS_BY_EMAIL', '.email'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                prefix: {
                  operation: 'begins_with',
                },
              },
            },
          },
        });

        const { instance, query, expectedResult } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.prefix({
          email: 'test@example.com',
          value: 'a',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL', 'test@example.com'],
          index: 'anotherIndex',
          range: {
            operation: 'begins_with',
            value: 'a',
          },
        });
        expect(result).toBe(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.prefix();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.prefix({});

        // @ts-expect-error value is required
        instance.buildMethods().queryIndex.byEmail.prefix({ email: 'q' });
      });

      it('should handle range query with index partition params [getter] + with range query params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmailProvider: {
              getPartitionKey: ({ email }: { email: string }) => [
                'USERS_BY_EMAIL_PROVIDER',
                email?.split?.('@')?.[1],
              ],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                startingWith: {
                  operation: 'begins_with',
                  getValues: ({ prefix }: { prefix: string }) => ({ value: prefix }),
                },
              },
            },
          },
        });

        const { instance, query } = queryInstance(user);

        await instance.buildMethods().queryIndex.byEmailProvider.startingWith({
          email: 'some@gmail.com',
          prefix: 'k',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],
          index: 'anotherIndex',
          range: {
            operation: 'begins_with',
            value: 'k',
          },
        });

        // --- TYPES ---

        // @ts-expect-error email/prefix is required
        instance.buildMethods().queryIndex.byEmailProvider.startingWith();

        // @ts-expect-error email/prefix is required
        instance.buildMethods().queryIndex.byEmailProvider.startingWith({});

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmailProvider.startingWith({ prefix: 'k' });

        // @ts-expect-error prefix is required
        instance.buildMethods().queryIndex.byEmailProvider.startingWith({ email: 't@t.com' });
      });

      it('should handle range query with index partition params [key array] + with range query params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: ['USERS_BY_EMAIL', '.email'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                startingWith: {
                  operation: 'begins_with',
                  getValues: ({ prefix }: { prefix: string }) => ({ value: prefix }),
                },
              },
            },
          },
        });

        const { instance, query } = queryInstance(user);

        await instance.buildMethods().queryIndex.byEmail.startingWith({
          email: 'test@example.com',
          prefix: 'k',
        });

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL', 'test@example.com'],
          index: 'anotherIndex',
          range: {
            operation: 'begins_with',
            value: 'k',
          },
        });

        // --- TYPES ---

        // @ts-expect-error email/prefix is required
        instance.buildMethods().queryIndex.byEmail.startingWith();

        // @ts-expect-error email/prefix is required
        instance.buildMethods().queryIndex.byEmail.startingWith({});

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.startingWith({ prefix: 'k' });

        // @ts-expect-error prefix is required
        instance.buildMethods().queryIndex.byEmail.startingWith({ email: 't@t.com' });
      });

      it('should forward query config params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                aToF: {
                  operation: 'between',
                  getValues: () => ({ end: 'f', start: 'a' }),
                },
              },
            },
          },
        });

        const { instance, query } = queryInstance(user);

        await instance.buildMethods().queryIndex.byEmail.aToF({
          limit: 10,
          retrieveOrder: 'DESC',
          filters: { name: 'John' },
        });

        expect(query).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL'],
          index: 'anotherIndex',
          range: {
            operation: 'between',
            end: 'f',
            start: 'a',
          },
          limit: 10,
          retrieveOrder: 'DESC',
          filters: { name: 'John' },
        });
      });

      it('[TYPES] Return type should be QueryResult<Entity>', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                aToF: {
                  operation: 'between',
                  getValues: () => ({ end: 'f', start: 'a' }),
                },
              },
            },
          },
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.aToF();

        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;
      });

      it('[TYPES] Extend: Return type should include extended properties', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
          indexes: {
            byEmail: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: () => ['#DATA'],
              index: 'anotherIndex',
              rangeQueries: {
                aToF: {
                  operation: 'between',
                  getValues: () => ({ end: 'f', start: 'a' }),
                },
              },
            },
          },
        });

        const { instance } = queryInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.aToF();

        interface NewUser923 extends User {
          newProperty: number;
        }

        // @ts-expect-error User is not enough
        type _R = Expect<Equal<typeof result, { items: User[]; paginationToken?: string }>>;

        type _R2 = Expect<Equal<typeof result, { items: NewUser923[]; paginationToken?: string }>>;
      });
    });
  });
});
