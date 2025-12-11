/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { keyFor, paramsFor, User } from './helpers.test';

describe('single table - from entity - delete', () => {
  it('should work with entity partition key params [getter]', async () => {
    const params = paramsFor('delete');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().delete({ id: 'my-id' });

    expect(params.dynamodbProvider.delete).toHaveBeenCalled();
    expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: ['USER', 'my-id'].join('#'),
        [params.rangeKey]: '#DATA',
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

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ['USER', '.id'],

      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().delete({ id: 'my-id' });

    expect(params.dynamodbProvider.delete).toHaveBeenCalled();
    expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: ['USER', 'my-id'].join('#'),
        [params.rangeKey]: '#DATA',
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

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: () => ['USERS'],

      getRangeKey: ({ id }: Pick<User, 'id'>) => [id],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().delete({ id: 'my-id' });

    expect(params.dynamodbProvider.delete).toHaveBeenCalled();
    expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: 'USERS',
        [params.rangeKey]: 'my-id',
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

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ['USERS'],

      getRangeKey: ['.id'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    await instance.buildMethods().delete({ id: 'my-id' });

    expect(params.dynamodbProvider.delete).toHaveBeenCalled();
    expect(params.dynamodbProvider.delete).toHaveBeenCalledWith({
      table: params.table,

      key: {
        [params.partitionKey]: 'USERS',
        [params.rangeKey]: 'my-id',
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
      table: params.table,

      key: {
        [params.partitionKey]: 'USER',
        [params.rangeKey]: '#DATA',
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
      table: params.table,

      key: {
        [params.partitionKey]: 'USER',
        [params.rangeKey]: '#DATA',
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
      table: params.table,

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
      table: params.table,

      key: {
        [params.partitionKey]: user.getPartitionKey({ id }).join('#'),
        [params.rangeKey]: user.getRangeKey({ name }).join('#'),
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
      table: params.table,

      key: {
        [params.partitionKey]: user.getPartitionKey({ id }).join('#'),
        [params.rangeKey]: user.getRangeKey({ name }).join('#'),
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
      table: params.table,

      key: {
        [params.partitionKey]: user.getPartitionKey({ id }).join('#'),
        [params.rangeKey]: user.getRangeKey({ name }).join('#'),
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
