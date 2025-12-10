import { SingleTableSchema } from '../../schema';

import { tableConfig, User } from './helpers.test';

const baseEntityParams = {
  type: 'USER',

  getPartitionKey: ({ id }: { id: string }) => ['USER', id],

  getRangeKey: () => ['#DATA'],
};

describe('single table schema - entity - creation params', () => {
  it('should build basic creation params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as(baseEntityParams);

    schema.from(user);

    const item = {
      id: 'id',
      address: 'address',
      createdAt: 'now',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
    };

    const createParams = user.getCreationParams(item);

    expect(createParams.item).toStrictEqual(item);
    expect(createParams.key).toStrictEqual({
      partitionKey: ['USER', 'id'],
      rangeKey: ['#DATA'],
    });
    expect(createParams.type).toBe('USER');
  });

  it('should accept expiresAt if table config allows it', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as(baseEntityParams);

    schema.from(user);

    const createParams = user.getCreationParams(
      {
        id: 'id',
        address: 'address',
        createdAt: 'now',
        dob: '1970',
        email: 'test@email.com',
        name: 'User',
      },
      {
        expiresAt: 2032043,
      },
    );

    expect(createParams.expiresAt).toEqual(2032043);
    expect(createParams.type).toBe('USER');
  });

  it('should properly build index mapping', () => {
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

    const createItems = {
      id: 'id',
      address: 'address',
      createdAt: 'now',
      dob: '1970',
      email: 'test@EMAIL.com',
      name: 'User',
    };

    const createParams = user.getCreationParams(createItems, {
      expiresAt: 2032043,
    });

    expect(createParams.item).toStrictEqual(createItems);
    expect(createParams.key).toStrictEqual({
      partitionKey: ['USER', 'id'],
      rangeKey: ['#DATA'],
    });
    expect(createParams.type).toBe('USER');
    expect(createParams.expiresAt).toEqual(2032043);
    expect(createParams.indexes).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['test@email.com'],
      },
    });
  });

  it('should fully build params with all options', () => {
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

    const item = {
      id: 'id',
      address: 'address',
      createdAt: 'now',
      dob: '1970',
      email: 'test@EMAIL.com',
      name: 'User',
    };

    const createParams = user.getCreationParams(item, {
      expiresAt: 2032043,
    });

    expect(createParams.item).toStrictEqual(item);
    expect(createParams.key).toStrictEqual({
      partitionKey: ['USER', 'id'],
      rangeKey: ['#DATA'],
    });
    expect(createParams.type).toBe('USER');
    expect(createParams.expiresAt).toEqual(2032043);
    expect(createParams.indexes).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['test@email.com'],
      },
    });
  });

  it('should build params with multiple indexes', () => {
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
          getPartitionKey: ({ name }: { name: string }) => ['BY_NAME', name],
          getRangeKey: ({ createdAt }: { createdAt: string }) => [createdAt],
          index: 'someIndex',
        },
      },
    });

    schema.from(user);

    const createParams = user.getCreationParams({
      id: 'id',
      address: 'address',
      createdAt: '2024-01-01',
      dob: '1970',
      email: 'test@EMAIL.com',
      name: 'John',
    });

    expect(createParams.indexes).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['test@email.com'],
      },
      someIndex: {
        partitionKey: ['BY_NAME', 'John'],
        rangeKey: ['2024-01-01'],
      },
    });
  });

  it('should handle incomplete index data gracefully', () => {
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
          getPartitionKey: ({ name }: { name: string }) => ['BY_NAME', name],
          getRangeKey: ({ updatedAt }: { updatedAt?: string }) => [updatedAt!],
          index: 'someIndex',
        },
      },
    });

    schema.from(user);

    const createParams = user.getCreationParams({
      id: 'id',
      address: 'address',
      createdAt: '2024-01-01',
      dob: '1970',
      email: 'test@EMAIL.com',
      name: 'John',
    });

    // Should generate keys for indexes with complete data
    expect(createParams.indexes).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['test@email.com'],
      },
      someIndex: {
        partitionKey: ['BY_NAME', 'John'],
      },
    });
  });

  it('should work with entity requiring multiple key params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id, email }: { id: string; email: string }) => [
        'USER',
        id,
        email,
      ],
      getRangeKey: ({ createdAt }: { createdAt: string }) => ['DATE', createdAt],
    });

    schema.from(user);

    const item = {
      id: 'id',
      address: 'address',
      createdAt: '2024-01-01',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
    };

    const createParams = user.getCreationParams(item);

    expect(createParams.key).toStrictEqual({
      partitionKey: ['USER', 'id', 'test@email.com'],
      rangeKey: ['DATE', '2024-01-01'],
    });
    expect(createParams.item).toStrictEqual(item);
    expect(createParams.type).toBe('USER');
  });
});
