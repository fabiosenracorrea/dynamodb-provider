/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal } from 'types';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { paramsFor, User } from './helpers.test';

describe('single table - from entity - batch get', () => {
  it('should work with entity partition key params [getter]', async () => {
    const params = paramsFor('batchGet', []);

    const schema = new SingleTableSchema(params);

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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER#id1', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER#id2', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER#id3', [params.rangeKey]: '#DATA' },
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

    const schema = new SingleTableSchema(params);

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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER#id1', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER#id2', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER#id3', [params.rangeKey]: '#DATA' },
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

    const schema = new SingleTableSchema(params);

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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USERS', [params.rangeKey]: 'id1' },
        { [params.partitionKey]: 'USERS', [params.rangeKey]: 'id2' },
      ],
    });

    // --- TYPES --

    // @ts-expect-error keys must have id
    instance.buildMethods().batchGet({ keys: [{}] });
  });

  it('should work with entity range key params [key array]', async () => {
    const params = paramsFor('batchGet', []);

    const schema = new SingleTableSchema(params);

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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USERS', [params.rangeKey]: 'id1' },
        { [params.partitionKey]: 'USERS', [params.rangeKey]: 'id2' },
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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER', [params.rangeKey]: '#DATA' },
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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER', [params.rangeKey]: '#DATA' },
        { [params.partitionKey]: 'USER', [params.rangeKey]: '#DATA' },
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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER#id1', [params.rangeKey]: 'John' },
        { [params.partitionKey]: 'USER#id2', [params.rangeKey]: 'Jane' },
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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER#id1', [params.rangeKey]: 'John' },
        { [params.partitionKey]: 'USER#id2', [params.rangeKey]: 'Jane' },
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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER#id1', [params.rangeKey]: 'John' },
        { [params.partitionKey]: 'USER#id2', [params.rangeKey]: 'Jane' },
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
      table: params.table,

      keys: [
        { [params.partitionKey]: 'USER#id1', [params.rangeKey]: 'John' },
        { [params.partitionKey]: 'USER#id2', [params.rangeKey]: 'Jane' },
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
