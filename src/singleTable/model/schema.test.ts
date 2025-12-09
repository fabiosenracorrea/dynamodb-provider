/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'crypto';

import { Equal, Expect, FirstParameter } from 'types';
import { SingleTableSchema } from './schema';

jest.mock('crypto');

const config = {
  dynamodbProvider: {} as any,
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

interface User {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
}

describe('single table schema tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('create entity tests', () => {
    it('should create a simple entity [getter param + getter no params]', () => {
      const schema = new SingleTableSchema(config);

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

      type _Tests = [Expect<Equal<FirstParameter<typeof user.getKey>, { id: string }>>];
    });

    it('should create a simple entity [getter param + getter param]', () => {
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
          Equal<
            FirstParameter<typeof user.getKey>,
            { id: string; email: string; createdAt: string }
          >
        >,
        Expect<Equal<FirstParameter<typeof user.getPartitionKey>, { id: string; email: string }>>,
        Expect<Equal<FirstParameter<typeof user.getRangeKey>, { createdAt: string }>>,
      ];
    });

    it('should create a simple entity [array notation + getter param]', () => {
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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
      const schema = new SingleTableSchema(config);

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

    describe('entity type', () => {
      it('creation: should add the type property if type-index present', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const createParams = {
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        };

        const params = user.getCreationParams(createParams);

        expect(params.type).toBe('USER');

        expect(params.item).toStrictEqual(createParams);
      });

      it('creation: should not add the type property if type-index not present', () => {
        const schema = new SingleTableSchema({
          dynamodbProvider: {} as any,
          partitionKey: 'hello',
          rangeKey: 'key',
          table: 'my-table',
        });

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const createAs = {
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        };

        const params = user.getCreationParams(createAs);

        expect((params as any).type).toBe(undefined);

        expect(params.item).toStrictEqual(createAs);
      });
    });

    describe('auto-gen', () => {
      it('creation: should auto-gen specified fields', () => {
        const schema = new SingleTableSchema(config);

        interface User123 extends User {
          hash: string;
        }

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));
        (randomUUID as jest.Mock).mockReturnValue('mocked-uuid');

        const user = schema.createEntity<User123>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onCreate: {
              id: 'UUID',
              createdAt: 'timestamp',
              hash: () => 'my-hash',
            },
          },
        });

        const creationParams = {
          address: 'address',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        };

        const params = user.getCreationParams(creationParams);

        expect(params.item).toStrictEqual({
          ...creationParams,

          createdAt: mockTimestamp,
          id: 'mocked-uuid',
          hash: 'my-hash',
        });

        jest.useRealTimers();

        type _T = Expect<Equal<typeof params.item, User123>>;
      });

      it('update: should auto-gen specified fields', () => {
        const schema = new SingleTableSchema(config);

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          autoGen: {
            onUpdate: {
              updatedAt: 'timestamp',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },
        });

        expect(params.values).toStrictEqual({
          email: 'new@email.com',
          updatedAt: mockTimestamp,
        });

        jest.useRealTimers();
      });

      it('creation: should NOT overwrite provided values', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onCreate: {
              id: 'UUID',
              createdAt: 'timestamp',
            },
          },
        });

        const creationParams = {
          id: 'user-provided-id',
          address: 'address',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
          createdAt: '2020-01-01T00:00:00.000Z',
        };

        const params = user.getCreationParams(creationParams);

        expect(params.item).toStrictEqual(creationParams);
      });

      it('creation: should handle partial auto-gen', () => {
        const schema = new SingleTableSchema(config);

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));
        (randomUUID as jest.Mock).mockReturnValue('mocked-uuid');

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onCreate: {
              id: 'UUID',
              createdAt: 'timestamp',
            },
          },
        });

        const creationParams = {
          id: 'explicit-id',
          address: 'address',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        };

        const params = user.getCreationParams(creationParams);

        expect(params.item).toStrictEqual({
          ...creationParams,
          createdAt: mockTimestamp,
        });

        expect(params.item.id).toBe('explicit-id');

        jest.useRealTimers();
      });

      it('update: should NOT overwrite provided values', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onUpdate: {
              updatedAt: 'timestamp',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',
          values: {
            email: 'new@email.com',
            updatedAt: '2020-01-01T00:00:00.000Z',
          },
        });

        expect(params.values).toStrictEqual({
          email: 'new@email.com',
          updatedAt: '2020-01-01T00:00:00.000Z',
        });
      });

      it('update: should add values object if not present', () => {
        const schema = new SingleTableSchema(config);

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onUpdate: {
              updatedAt: 'timestamp',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',
          remove: ['email'],
        });

        expect(params.values).toStrictEqual({
          updatedAt: mockTimestamp,
        });

        expect(params.remove).toStrictEqual(['email']);

        jest.useRealTimers();
      });

      it('update: should preserve other update parameters', () => {
        const schema = new SingleTableSchema(config);

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

        interface User333 extends User {
          loginCount: number;
        }

        const user = schema.createEntity<User333>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onUpdate: {
              updatedAt: 'timestamp',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',
          values: {
            email: 'new@email.com',
          },
          remove: ['address'],
          atomicOperations: [{ type: 'add', property: 'loginCount', value: 1 }],
          conditions: [{ operation: 'exists', property: 'id' }],
          returnUpdatedProperties: true,
        });

        expect(params.values).toStrictEqual({
          email: 'new@email.com',
          updatedAt: mockTimestamp,
        });

        expect(params.remove).toStrictEqual(['address']);
        expect(params.atomicOperations).toStrictEqual([
          { operation: 'add', property: 'loginCount', value: 1 },
        ]);
        expect(params.conditions).toStrictEqual([{ operation: 'exists', property: 'id' }]);
        expect(params.returnUpdatedProperties).toBe(true);

        jest.useRealTimers();
      });

      it('update: should work with only atomicOperations', () => {
        const schema = new SingleTableSchema(config);

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        interface User3345 extends User {
          loginCount: number;
        }

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

        const user = schema.createEntity<User3345>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          autoGen: {
            onUpdate: {
              updatedAt: 'timestamp',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',
          atomicOperations: [{ type: 'add', property: 'loginCount', value: 1 }],
        });

        expect(params.values).toStrictEqual({
          updatedAt: mockTimestamp,
        });

        expect(params.atomicOperations).toStrictEqual([
          { operation: 'add', property: 'loginCount', value: 1 },
        ]);

        jest.useRealTimers();
      });
    });

    describe('range-queries', () => {
      it('should handle begins_with with no params [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            userData: {
              operation: 'begins_with',
              getValues: () => ({
                value: '#DATA',
              }),
            },
          },
        });

        expect(user.rangeQueries.userData()).toStrictEqual({
          operation: 'begins_with',
          value: '#DATA',
        });

        // -- TYPES --

        type _Tests = [
          //
          Expect<Equal<FirstParameter<typeof user.rangeQueries.userData>, undefined>>,
        ];
      });

      it('should handle begins_with with single param [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            byPrefix: {
              operation: 'begins_with',
              getValues: ({ prefix }: { prefix: string }) => ({
                value: prefix,
              }),
            },
          },
        });

        expect(user.rangeQueries.byPrefix({ prefix: 'USER#' })).toStrictEqual({
          operation: 'begins_with',
          value: 'USER#',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.byPrefix>, { prefix: string }>>,
        ];
      });

      it('should handle begins_with [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            byPrefix: {
              operation: 'begins_with',
            },
          },
        });

        expect(user.rangeQueries.byPrefix({ value: 'PREFIX' })).toStrictEqual({
          operation: 'begins_with',
          value: 'PREFIX',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.byPrefix>, 'value'>>,
        ];
      });

      it('should handle between with params [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            dateRange: {
              operation: 'between',
              getValues: ({ startDate, endDate }: { startDate: string; endDate: string }) => ({
                start: startDate,
                end: endDate,
              }),
            },
          },
        });

        expect(
          user.rangeQueries.dateRange({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          }),
        ).toStrictEqual({
          operation: 'between',
          start: '2024-01-01',
          end: '2024-12-31',
        });

        // -- TYPES --

        type _Tests = [
          Expect<
            Equal<
              FirstParameter<typeof user.rangeQueries.dateRange>,
              { startDate: string; endDate: string }
            >
          >,
        ];
      });

      it('should handle between [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            range: {
              operation: 'between',
            },
          },
        });

        expect(
          user.rangeQueries.range({
            start: 'A',
            end: 'Z',
          }),
        ).toStrictEqual({
          operation: 'between',
          start: 'A',
          end: 'Z',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.range>, 'start' | 'end'>>,
        ];
      });

      it('should handle equal with single param [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            exactMatch: {
              operation: 'equal',
              getValues: ({ targetValue }: { targetValue: string }) => ({
                value: targetValue,
              }),
            },
          },
        });

        expect(user.rangeQueries.exactMatch({ targetValue: 'EXACT' })).toStrictEqual({
          operation: 'equal',
          value: 'EXACT',
        });

        // -- TYPES --

        type _Tests = [
          Expect<
            Equal<FirstParameter<typeof user.rangeQueries.exactMatch>, { targetValue: string }>
          >,
        ];
      });

      it('should handle equal [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            exactMatch: {
              operation: 'equal',
            },
          },
        });

        expect(user.rangeQueries.exactMatch({ value: 'EXACT' })).toStrictEqual({
          operation: 'equal',
          value: 'EXACT',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.exactMatch>, 'value'>>,
        ];
      });

      it('should handle lower_than with single param [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            before: {
              operation: 'lower_than',
              getValues: ({ maxValue }: { maxValue: string }) => ({
                value: maxValue,
              }),
            },
          },
        });

        expect(user.rangeQueries.before({ maxValue: '2024-12-31' })).toStrictEqual({
          operation: 'lower_than',
          value: '2024-12-31',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.before>, { maxValue: string }>>,
        ];
      });

      it('should handle lower_than [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            before: {
              operation: 'lower_than',
            },
          },
        });

        expect(user.rangeQueries.before({ value: '100' })).toStrictEqual({
          operation: 'lower_than',
          value: '100',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.before>, 'value'>>,
        ];
      });

      it('should handle lower_or_equal_than with single param [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            upTo: {
              operation: 'lower_or_equal_than',
              getValues: ({ maxValue }: { maxValue: string }) => ({
                value: maxValue,
              }),
            },
          },
        });

        expect(user.rangeQueries.upTo({ maxValue: '2024-12-31' })).toStrictEqual({
          operation: 'lower_or_equal_than',
          value: '2024-12-31',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.upTo>, { maxValue: string }>>,
        ];
      });

      it('should handle lower_or_equal_than [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            upTo: {
              operation: 'lower_or_equal_than',
            },
          },
        });

        expect(user.rangeQueries.upTo({ value: '100' })).toStrictEqual({
          operation: 'lower_or_equal_than',
          value: '100',
        });

        // -- TYPES --

        type _Tests = [Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.upTo>, 'value'>>];
      });

      it('should handle bigger_than with single param [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            after: {
              operation: 'bigger_than',
              getValues: ({ minValue }: { minValue: string }) => ({
                value: minValue,
              }),
            },
          },
        });

        expect(user.rangeQueries.after({ minValue: '2024-01-01' })).toStrictEqual({
          operation: 'bigger_than',
          value: '2024-01-01',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.after>, { minValue: string }>>,
        ];
      });

      it('should handle bigger_than [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            after: {
              operation: 'bigger_than',
            },
          },
        });

        expect(user.rangeQueries.after({ value: '100' })).toStrictEqual({
          operation: 'bigger_than',
          value: '100',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.after>, 'value'>>,
        ];
      });

      it('should handle bigger_or_equal_than with single param [custom getValues]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            from: {
              operation: 'bigger_or_equal_than',
              getValues: ({ minValue }: { minValue: string }) => ({
                value: minValue,
              }),
            },
          },
        });

        expect(user.rangeQueries.from({ minValue: '2024-01-01' })).toStrictEqual({
          operation: 'bigger_or_equal_than',
          value: '2024-01-01',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.from>, { minValue: string }>>,
        ];
      });

      it('should handle bigger_or_equal_than [default behavior]', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            from: {
              operation: 'bigger_or_equal_than',
            },
          },
        });

        expect(user.rangeQueries.from({ value: '100' })).toStrictEqual({
          operation: 'bigger_or_equal_than',
          value: '100',
        });

        // -- TYPES --

        type _Tests = [Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.from>, 'value'>>];
      });

      it('should handle multiple range queries with different param types', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            noParams: {
              operation: 'begins_with',
              getValues: () => ({
                value: 'STATIC',
              }),
            },
            singleParam: {
              operation: 'equal',
              getValues: ({ target }: { target: string }) => ({
                value: target,
              }),
            },
            multiParams: {
              operation: 'between',
              getValues: ({ from, to }: { from: string; to: string }) => ({
                start: from,
                end: to,
              }),
            },
            defaultBehavior: {
              operation: 'bigger_than',
            },
          },
        });

        expect(user.rangeQueries.noParams()).toStrictEqual({
          operation: 'begins_with',
          value: 'STATIC',
        });

        expect(user.rangeQueries.singleParam({ target: 'TARGET' })).toStrictEqual({
          operation: 'equal',
          value: 'TARGET',
        });

        expect(user.rangeQueries.multiParams({ from: 'A', to: 'Z' })).toStrictEqual({
          operation: 'between',
          start: 'A',
          end: 'Z',
        });

        expect(user.rangeQueries.defaultBehavior({ value: '50' })).toStrictEqual({
          operation: 'bigger_than',
          value: '50',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.noParams>, undefined>>,
          Expect<Equal<FirstParameter<typeof user.rangeQueries.singleParam>, { target: string }>>,
          Expect<
            Equal<
              FirstParameter<typeof user.rangeQueries.multiParams>,
              { from: string; to: string }
            >
          >,
          Expect<Equal<keyof FirstParameter<typeof user.rangeQueries.defaultBehavior>, 'value'>>,
        ];
      });

      it('should handle complex getValues transformations', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            emailPrefix: {
              operation: 'begins_with',
              getValues: ({ email }: { email: string }) => ({
                value: email.toLowerCase(),
              }),
            },
            dateRangeISO: {
              operation: 'between',
              getValues: ({ startDate, endDate }: { startDate: Date; endDate: Date }) => ({
                start: startDate.toISOString(),
                end: endDate.toISOString(),
              }),
            },
            numericThreshold: {
              operation: 'bigger_or_equal_than',
              getValues: ({ threshold }: { threshold: number }) => ({
                value: threshold.toString(),
              }),
            },
          },
        });

        expect(user.rangeQueries.emailPrefix({ email: 'TEST@EXAMPLE.COM' })).toStrictEqual({
          operation: 'begins_with',
          value: 'test@example.com',
        });

        const start = new Date('2024-01-01T00:00:00.000Z');
        const end = new Date('2024-12-31T23:59:59.999Z');

        expect(user.rangeQueries.dateRangeISO({ startDate: start, endDate: end })).toStrictEqual({
          operation: 'between',
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-12-31T23:59:59.999Z',
        });

        expect(user.rangeQueries.numericThreshold({ threshold: 100 })).toStrictEqual({
          operation: 'bigger_or_equal_than',
          value: '100',
        });

        // -- TYPES --

        type _Tests = [
          Expect<Equal<FirstParameter<typeof user.rangeQueries.emailPrefix>, { email: string }>>,
          Expect<
            Equal<
              FirstParameter<typeof user.rangeQueries.dateRangeISO>,
              { startDate: Date; endDate: Date }
            >
          >,
          Expect<
            Equal<FirstParameter<typeof user.rangeQueries.numericThreshold>, { threshold: number }>
          >,
        ];
      });
    });

    describe('indexes', () => {
      it('should properly handle index base props', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },
          },
        });

        expect(user.indexes.BY_EMAIL.index).toBe('anotherIndex');
        expect(user.indexes.BY_EMAIL.getPartitionKey()).toStrictEqual(['USERS_BY_EMAIL']);
        expect(user.indexes.BY_EMAIL.getRangeKey({ email: 'email@EMAIL.com' })).toStrictEqual([
          'email@email.com',
        ]);

        expect(
          user.indexes.BY_EMAIL.getKey({
            email: 'email@EMAIL.com',
          }),
        ).toStrictEqual({
          partitionKey: ['USERS_BY_EMAIL'],
          rangeKey: ['email@email.com'],
        });
      });

      it('should properly generate getCreationIndexMapping', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getCreationIndexMapping({
          email: 'some@email.com',
          name: 'Username',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
            rangeKey: ['_name', 'username'],
          },
        });
      });

      it('getCreationIndexMapping should allow incomplete references', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getCreationIndexMapping({
          email: 'some@email.com',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
          },
        });
      });

      it('should properly generate getUpdatedIndexMapping', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getUpdatedIndexMapping({
          email: 'some@email.com',
          name: 'Username',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
            rangeKey: ['_name', 'username'],
          },
        });
      });

      it('getUpdatedIndexMapping should allow incomplete references', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getUpdatedIndexMapping({
          email: 'some@email.com',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
          },
        });
      });

      it('range queries: should handle NO param queries', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
              rangeQueries: {
                aEmails: {
                  operation: 'begins_with',
                  getValues: () => ({
                    value: 'a',
                  }),
                },
              },
            },
          },
        });

        expect(user.indexes.BY_EMAIL.rangeQueries.aEmails()).toStrictEqual({
          operation: 'begins_with',
          value: `a`,
        });
      });

      it('range queries: should handle param queries', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
              rangeQueries: {
                prefix: {
                  operation: 'begins_with',
                  getValues: ({ emailStart }: { emailStart: string }) => ({
                    value: emailStart,
                  }),
                },
              },
            },
          },
        });

        expect(
          user.indexes.BY_EMAIL.rangeQueries.prefix({
            emailStart: 'fab',
          }),
        ).toStrictEqual({
          operation: 'begins_with',
          value: `fab`,
        });
      });
    });

    describe('creation params', () => {
      it('should accept expiresAt if table config allows it', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

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
      });

      it('should properly build index mapping', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },
          },
        });

        const createParams = user.getCreationParams(
          {
            id: 'id',
            address: 'address',
            createdAt: 'now',
            dob: '1970',
            email: 'test@EMAIL.com',
            name: 'User',
          },
          {
            expiresAt: 2032043,
          },
        );

        expect(createParams.expiresAt).toEqual(2032043);
        expect(createParams.indexes).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['test@email.com'],
          },
        });
      });

      it('should fully build params', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },
          },
        });

        const createParams = user.getCreationParams(
          {
            id: 'id',
            address: 'address',
            createdAt: 'now',
            dob: '1970',
            email: 'test@EMAIL.com',
            name: 'User',
          },
          {
            expiresAt: 2032043,
          },
        );

        expect(createParams.expiresAt).toEqual(2032043);
        expect(createParams.indexes).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['test@email.com'],
          },
        });
        expect(createParams.item).toStrictEqual({
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@EMAIL.com',
          name: 'User',
        });
      });
    });

    describe('update params', () => {
      it('should properly build key reference', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
        });
      });

      it('should handle expiresAt', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,
        });
      });

      it('should handle indexes', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,

          indexes: {
            anotherIndex: {
              partitionKey: ['USERS_BY_EMAIL'],
              rangeKey: ['new@email.com'],
            },
          },
        });
      });

      it('should simply forward atomicOperations, conditions, remove and returnUpdatedProperties values', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },
          },
        });

        const forwardValues = {
          atomicOperations: Symbol('atomicOperations'),
          conditions: Symbol('conditions'),
          remove: Symbol('remove'),
          returnUpdatedProperties: Symbol('returnUpdatedProperties'),
        } as any;

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,

          ...forwardValues,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,

          indexes: {
            anotherIndex: {
              partitionKey: ['USERS_BY_EMAIL'],
              rangeKey: ['new@email.com'],
            },
          },

          ...forwardValues,
        });
      });
    });

    describe('parsers', () => {
      it('should have a _parser_ property if _extend_ is provided', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          extend: () => ({
            someProp: 'yes',
          }),
        });

        expect(user.parser).toBeTruthy();
      });

      it('parser should merge data with extend', () => {
        const schema = new SingleTableSchema(config);

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          extend: () => ({
            someProp: 'yes',
            id: 'OVERWRITE!',
          }),
        });

        expect(user.parser({ id: '11', dob: '2034-10-21' })).toStrictEqual({
          id: 'OVERWRITE!',
          dob: '2034-10-21',
          someProp: 'yes',
        });
      });
    });
  });

  describe('partition tests', () => {
    describe('entity partition tests', () => {
      it('should not allow 2 usages of the same entry', () => {
        const schema = new SingleTableSchema(config);

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
        const schema = new SingleTableSchema(config);

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
      });

      it('should throw on bad entry reference', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

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

      it('should properly build entity from entry', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

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

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = partition.use('data').create<User>().entity({
          type: 'USER',
        });

        expect(user.__dbType).toBe('ENTITY');
        expect(user.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);
        expect(user.getRangeKey()).toStrictEqual(['#DATA']);
        expect(user.getKey({ userId: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should properly build entity with param-match', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

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

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = partition
          .use('data')
          .create<User>()
          .entity({
            type: 'USER',

            paramMatch: {
              userId: 'id',
            },
          });

        expect(user.__dbType).toBe('ENTITY');

        expect(user.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

        expect(user.getRangeKey()).toStrictEqual(['#DATA']);

        expect(user.getKey({ id: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });
    });

    describe('index partition tests', () => {
      it('should not allow 2 usages of the same entry', () => {
        const schema = new SingleTableSchema({
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
        });

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
        const schema = new SingleTableSchema({
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
        });

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
      });

      it('should throw on bad entry reference', () => {
        const schema = new SingleTableSchema({
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
        });

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
        const schema = new SingleTableSchema({
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
        });

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

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const index = indexPartition.use('data').create<User>().index();

        expect(index.index).toBe('anotherIndex');

        expect(index.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        // @ts-expect-error bad inference, it should not take params here
        expect(index.getRangeKey()).toStrictEqual(['#DATA']);

        expect(index.getKey({ userId: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should build a standard index with param match', () => {
        const schema = new SingleTableSchema({
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
        });

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

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

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

        expect(index.getRangeKey({})).toStrictEqual(['#DATA']);

        expect(index.getKey({ id: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should allow range queries to be forwarded', () => {
        const schema = new SingleTableSchema({
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
        });

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

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

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

  describe('collection tests', () => {
    type User = {
      name: string;
      id: string;
      email: string;
      address: string;
      dob: string;
      createdAt: string;
      updatedAt?: string;
    };

    type UserLoginAttempt = {
      userId: string;
      timestamp: string;
      device: string;
      success: boolean;
    };

    const params = {
      partitionKey: 'hello',
      rangeKey: 'key',

      table: 'my-table',
    };

    describe('basic properties', () => {
      const schema = new SingleTableSchema(params);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
        },
      });

      const user = partition
        .use('data')
        .create<User>()
        .entity({
          type: 'USER',

          paramMatch: { userId: 'id' },
        });

      const loginAttempts = partition.use('loginAttempts').create<UserLoginAttempt>().entity({
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
                          type: 'SINGLE',
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

        expect(collection.join.loginAttempts.join.deep2.join.deep3.join.deep4.ref).toBe(user.type);
        expect(collection.join.loginAttempts.join.deep2.join.deep3.join.deep4.entity).toBe(user);
      });
    });

    describe('collection index ref', () => {
      it('should infer partition index', () => {
        const schema = new SingleTableSchema({
          ...params,

          indexes: {
            oneIndex: {
              partitionKey: '_pk1',
              rangeKey: '_sk1',
            },
          },
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          index: 'oneIndex',
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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

          getPartitionKey: ({ userId }: { userId: string }) => ['USER_LOGIN_ATTEMPT', userId],

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

        expect(userCollection.index).toBe('oneIndex');
      });

      it('should allow index if configured', () => {
        const schema = new SingleTableSchema({
          ...params,

          indexes: {
            oneIndex: {
              partitionKey: '_pk1',
              rangeKey: '_sk1',
            },
          },
        });

        const user = schema.createEntity<User>().as({
          type: 'USER',

          getPartitionKey: () => ['USERS'],

          getRangeKey: ({ createdAt }: { createdAt: string }) => [createdAt],

          indexes: {
            singleUser: {
              getPartitionKey: ({ id }: { id: string }) => ['USER', id],

              getRangeKey: () => [`#DATA`],

              index: 'oneIndex',
            },
          },
        });

        const loginAttempts = schema.createEntity<UserLoginAttempt>().as({
          type: 'USER_LOGIN_ATTEMPT',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER_LOGIN_ATTEMPT', userId],

          getRangeKey: ({ timestamp }: { timestamp: string }) => [timestamp],

          indexes: {
            singleUser: {
              getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

              getRangeKey: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],

              index: 'oneIndex',
            },
          },
        });

        const userCollection = schema.createCollection({
          type: 'SINGLE',

          ref: user,

          index: 'oneIndex',

          getPartitionKey: loginAttempts.indexes.singleUser.getPartitionKey,

          join: {
            loginAttempts: {
              type: 'MULTIPLE',
              entity: loginAttempts,
            },
          },
        });

        expect(userCollection.index).toBe('oneIndex');
      });
    });
  });
});
