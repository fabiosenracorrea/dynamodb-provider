/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter } from 'types';

import { SingleTableSchema } from '../../schema';

import { tableConfig, User } from './helpers.test';

describe('single table schema - entity - key definitions', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should create a simple entity [getter param + getter no params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'id' })).toStrictEqual(['USER', 'id']);
    expect(user.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.getKey({
        id: 'my-id',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type ExpectedKey = { id: string };

    type _Tests = [
      Expect<Equal<(typeof user)['__entity'], User>>,

      Expect<Equal<FirstParameter<typeof user.getKey>, ExpectedKey>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, ExpectedKey>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, undefined>>,

      Expect<
        Equal<Pick<FirstParameter<typeof user.getUpdateParams>, keyof ExpectedKey>, ExpectedKey>
      >,

      Expect<
        Equal<
          Pick<FirstParameter<typeof user.transactUpdateParams>, keyof ExpectedKey>,
          ExpectedKey
        >
      >,

      Expect<
        Equal<
          Pick<FirstParameter<typeof user.transactValidateParams>, keyof ExpectedKey>,
          ExpectedKey
        >
      >,
    ];
  });

  it('should create a simple entity [getter param + getter param]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ({ email }: { email: string }) => ['EMAIL', email],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);
    expect(user.getRangeKey({ email: 'test@example.com' })).toStrictEqual([
      'EMAIL',
      'test@example.com',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['EMAIL', 'user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string; email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { email: string }>>,
    ];
  });

  it('should create a simple entity [getter no params + getter no params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: () => ['USERS'],
      getRangeKey: () => ['#DATA'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey()).toStrictEqual(['USERS']);
    expect(user.getRangeKey()).toStrictEqual(['#DATA']);

    expect(user.getKey()).toStrictEqual({
      partitionKey: ['USERS'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [Expect<Equal<FirstParameter<typeof user.getKey>, undefined>>];
  });

  it('should create a simple entity [getter no params + getter param]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: () => ['USERS'],
      getRangeKey: ({ id }: { id: string }) => ['USER', id],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey()).toStrictEqual(['USERS']);
    expect(user.getRangeKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);

    expect(
      user.getKey({
        id: 'my-id',
      }),
    ).toStrictEqual({
      partitionKey: ['USERS'],
      rangeKey: ['USER', 'my-id'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { id: string }>>,
    ];
  });

  it('should create a simple entity [array notation + array notation]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id'],
      getRangeKey: ['#DATA'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);
    expect(user.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.getKey({
        id: 'my-id',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string }>>,
    ];
  });

  it('should create a simple entity [array notation with multiple refs + array notation]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id', '.email'],
      getRangeKey: ['DATA', '.createdAt'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id', email: 'test@example.com' })).toStrictEqual([
      'USER',
      'test-id',
      'test@example.com',
    ]);

    expect(user.getRangeKey({ createdAt: '2024-01-01' })).toStrictEqual(['DATA', '2024-01-01']);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        createdAt: '2024-01-01',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'user@example.com'],
      rangeKey: ['DATA', '2024-01-01'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; email: string; createdAt: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string; email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { createdAt: string }>>,
    ];
  });

  it('should create a simple entity [array notation + getter param]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id'],
      getRangeKey: ({ email }: { email: string }) => ['EMAIL', email],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);
    expect(user.getRangeKey({ email: 'test@example.com' })).toStrictEqual([
      'EMAIL',
      'test@example.com',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['EMAIL', 'user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string; email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string }>>,
    ];
  });

  it('should create a simple entity [array notation + getter no params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id'],
      getRangeKey: () => ['#DATA'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);
    expect(user.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.getKey({
        id: 'my-id',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, undefined>>,
    ];
  });

  it('should create a simple entity [getter param + array notation]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['EMAIL', '.email'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);
    expect(user.getRangeKey({ email: 'test@example.com' })).toStrictEqual([
      'EMAIL',
      'test@example.com',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['EMAIL', 'user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string; email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { email: string }>>,
    ];
  });

  it('should create a simple entity [getter no params + array notation]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: () => ['USERS'],
      getRangeKey: ['USER', '.id'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey()).toStrictEqual(['USERS']);
    expect(user.getRangeKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);

    expect(
      user.getKey({
        id: 'my-id',
      }),
    ).toStrictEqual({
      partitionKey: ['USERS'],
      rangeKey: ['USER', 'my-id'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { id: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, undefined>>,
    ];
  });

  it('should create a simple entity [array notation only constants + array notation only constants]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USERS', 'PARTITION'],
      getRangeKey: ['DATA', 'RANGE'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey()).toStrictEqual(['USERS', 'PARTITION']);
    expect(user.getRangeKey()).toStrictEqual(['DATA', 'RANGE']);

    expect(user.getKey()).toStrictEqual({
      partitionKey: ['USERS', 'PARTITION'],
      rangeKey: ['DATA', 'RANGE'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, undefined>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, undefined>>,
    ];
  });

  it('should create a simple entity [getter with multiple params + getter with multiple params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id, email }: { id: string; email: string }) => ['USER', id, email],
      getRangeKey: ({ name, address }: { name: string; address: string }) => [
        'DATA',
        name,
        address,
      ],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'id-123', email: 'test@example.com' })).toStrictEqual([
      'USER',
      'id-123',
      'test@example.com',
    ]);
    expect(user.getRangeKey({ name: 'John', address: '123 Street' })).toStrictEqual([
      'DATA',
      'John',
      '123 Street',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
        address: '456 Ave',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'user@example.com'],
      rangeKey: ['DATA', 'Jane', '456 Ave'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<
          FirstParameter<typeof user.getKey>,
          { id: string; email: string; name: string; address: string }
        >
      >,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string; email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { name: string; address: string }>>,
    ];
  });

  it('should create a simple entity [array with mixed constants and refs + array with mixed]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id', 'CONST', '.email'],
      getRangeKey: ['DATA', '.name', 'SEPARATOR', '.address'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'id-123', email: 'test@example.com' })).toStrictEqual([
      'USER',
      'id-123',
      'CONST',
      'test@example.com',
    ]);

    expect(user.getRangeKey({ name: 'John', address: '123 Street' })).toStrictEqual([
      'DATA',
      'John',
      'SEPARATOR',
      '123 Street',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
        address: '456 Ave',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'CONST', 'user@example.com'],
      rangeKey: ['DATA', 'Jane', 'SEPARATOR', '456 Ave'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<
          FirstParameter<typeof user.getKey>,
          { id: string; email: string; name: string; address: string }
        >
      >,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { name: string; address: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string; email: string }>>,
    ];
  });

  it('should create a simple entity [getter with multiple params + array notation]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id, email }: { id: string; email: string }) => ['USER', id, email],
      getRangeKey: ['DATA', '.name'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'id-123', email: 'test@example.com' })).toStrictEqual([
      'USER',
      'id-123',
      'test@example.com',
    ]);
    expect(user.getRangeKey({ name: 'John' })).toStrictEqual(['DATA', 'John']);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'user@example.com'],
      rangeKey: ['DATA', 'Jane'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; email: string; name: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string; email: string }>>,
    ];
  });

  it('should create a simple entity [array notation + getter with multiple params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id'],
      getRangeKey: ({ name, address }: { name: string; address: string }) => [
        'DATA',
        name,
        address,
      ],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'id-123' })).toStrictEqual(['USER', 'id-123']);
    expect(user.getRangeKey({ name: 'John', address: '123 Street' })).toStrictEqual([
      'DATA',
      'John',
      '123 Street',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        name: 'Jane',
        address: '456 Ave',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['DATA', 'Jane', '456 Ave'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; name: string; address: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { name: string; address: string }>>,
    ];
  });

  it('should create a simple entity [getter no params + getter with multiple params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: () => ['USERS'],
      getRangeKey: ({ id, email }: { id: string; email: string }) => ['USER', id, email],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey()).toStrictEqual(['USERS']);
    expect(user.getRangeKey({ id: 'test-id', email: 'test@example.com' })).toStrictEqual([
      'USER',
      'test-id',
      'test@example.com',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['USERS'],
      rangeKey: ['USER', 'my-id', 'user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string; email: string }>>,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { id: string; email: string }>>,
    ];
  });

  it('should create a simple entity [getter with multiple params + getter no params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id, name }: { id: string; name: string }) => ['USER', id, name],
      getRangeKey: () => ['#DATA'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id', name: 'John' })).toStrictEqual([
      'USER',
      'test-id',
      'John',
    ]);
    expect(user.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.getKey({
        id: 'my-id',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'Jane'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string; name: string }>>,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string; name: string }>>,
    ];
  });

  it('should create a simple entity [array with multiple refs + getter no params]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id', '.email', '.name'],
      getRangeKey: () => ['#DATA'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(
      user.getPartitionKey({ id: 'test-id', email: 'test@example.com', name: 'John' }),
    ).toStrictEqual(['USER', 'test-id', 'test@example.com', 'John']);
    expect(user.getRangeKey()).toStrictEqual(['#DATA']);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'user@example.com', 'Jane'],
      rangeKey: ['#DATA'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; email: string; name: string }>
      >,
    ];
  });

  it('should create a simple entity [getter no params + array with multiple refs]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: () => ['USERS'],
      getRangeKey: ['DATA', '.id', '.email', '.name'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey()).toStrictEqual(['USERS']);
    expect(
      user.getRangeKey({ id: 'test-id', email: 'test@example.com', name: 'John' }),
    ).toStrictEqual(['DATA', 'test-id', 'test@example.com', 'John']);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['USERS'],
      rangeKey: ['DATA', 'my-id', 'user@example.com', 'Jane'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; email: string; name: string }>
      >,
    ];
  });

  it('should create a simple entity [array with single ref + array with single ref]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['.id'],
      getRangeKey: ['.email'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['test-id']);
    expect(user.getRangeKey({ email: 'test@example.com' })).toStrictEqual(['test@example.com']);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
      }),
    ).toStrictEqual({
      partitionKey: ['my-id'],
      rangeKey: ['user@example.com'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<Equal<FirstParameter<typeof user.getKey>, { id: string; email: string }>>,
    ];
  });

  it('should create a simple entity [array mixed + getter single param]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ['USER', '.id', 'SEP', '.email'],
      getRangeKey: ({ name }: { name: string }) => ['DATA', name],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id', email: 'test@example.com' })).toStrictEqual([
      'USER',
      'test-id',
      'SEP',
      'test@example.com',
    ]);
    expect(user.getRangeKey({ name: 'John' })).toStrictEqual(['DATA', 'John']);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id', 'SEP', 'user@example.com'],
      rangeKey: ['DATA', 'Jane'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; email: string; name: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.getRangeKey>, { name: string }>>,
    ];
  });

  it('should create a simple entity [getter single param + array mixed]', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['EMAIL', '.email', 'NAME', '.name'],
    });

    expect(user.__dbType).toBe('ENTITY');
    expect(user.type).toBe('USER');

    expect(user.getPartitionKey({ id: 'test-id' })).toStrictEqual(['USER', 'test-id']);
    expect(user.getRangeKey({ email: 'test@example.com', name: 'John' })).toStrictEqual([
      'EMAIL',
      'test@example.com',
      'NAME',
      'John',
    ]);

    expect(
      user.getKey({
        id: 'my-id',
        email: 'user@example.com',
        name: 'Jane',
      }),
    ).toStrictEqual({
      partitionKey: ['USER', 'my-id'],
      rangeKey: ['EMAIL', 'user@example.com', 'NAME', 'Jane'],
    });

    // -- TYPES --

    type _Tests = [
      Expect<
        Equal<FirstParameter<typeof user.getKey>, { id: string; email: string; name: string }>
      >,
      Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string }>>,
    ];
  });

  it('should not allow 2 entities with the same type', () => {
    const schema = new SingleTableSchema(tableConfig);

    const doubleCreation = () => {
      schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER1', id],
        getRangeKey: () => ['#DATA'],
      });

      schema.createEntity<User>().as({
        type: 'USER',
        getPartitionKey: ({ id }: { id: string }) => ['USER2', id],
        getRangeKey: () => ['#DATA'],
      });
    };

    expect(doubleCreation).toThrow();
  });
});
