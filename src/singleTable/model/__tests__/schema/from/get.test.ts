/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal } from 'types';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { keyFor, paramsFor, User } from './helpers.test';

describe('single table - from entity - get', () => {
  it('should work with entity partition key params [getter]', async () => {
    const params = paramsFor('get');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().get({ id: 'my-id' });

    expect(params.dynamodbProvider.get).toHaveBeenCalled();
    expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: ['USER', 'my-id'].join('#'),
        [params.rangeKey]: '#DATA',
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

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ['USER', '.id'],

      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().get({ id: 'my-id' });

    expect(params.dynamodbProvider.get).toHaveBeenCalled();
    expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: ['USER', 'my-id'].join('#'),
        [params.rangeKey]: '#DATA',
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

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: () => ['USERS'],

      getRangeKey: ({ id }: Pick<User, 'id'>) => [id],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().get({ id: 'my-id' });

    expect(params.dynamodbProvider.get).toHaveBeenCalled();
    expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: 'USERS',
        [params.rangeKey]: 'my-id',
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

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ['USERS'],

      getRangeKey: ['.id'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().get({ id: 'my-id' });

    expect(params.dynamodbProvider.get).toHaveBeenCalled();
    expect(params.dynamodbProvider.get).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: 'USERS',
        [params.rangeKey]: 'my-id',
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
      table: params.table,

      key: {
        [params.partitionKey]: 'USER',
        [params.rangeKey]: '#DATA',
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
      table: params.table,

      key: {
        [params.partitionKey]: 'USER',
        [params.rangeKey]: '#DATA',
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
      table: params.table,

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
      table: params.table,

      key: {
        [params.partitionKey]: user.getPartitionKey({ id }).join('#'),
        [params.rangeKey]: user.getRangeKey({ name }).join('#'),
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
      table: params.table,

      key: {
        [params.partitionKey]: user.getPartitionKey({ id }).join('#'),
        [params.rangeKey]: user.getRangeKey({ name }).join('#'),
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
      table: params.table,

      key: {
        [params.partitionKey]: user.getPartitionKey({ id }).join('#'),
        [params.rangeKey]: user.getRangeKey({ name }).join('#'),
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
