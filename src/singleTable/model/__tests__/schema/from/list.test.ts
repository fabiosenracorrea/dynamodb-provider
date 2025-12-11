/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal } from 'types';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { baseParams, User } from './helpers.test';

describe('single table - from entity - listing', () => {
  it('should not exist if no type-index is defined', () => {
    const params = {
      dynamodbProvider: {} as any,
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

      type _R = Expect<
        // @ts-expect-error User is not enough
        Equal<typeof result, { items: User[]; paginationToken: string }>
      >;

      type _R2 = Expect<
        Equal<typeof result, { items: NewUser789[]; paginationToken: string }>
      >;
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
