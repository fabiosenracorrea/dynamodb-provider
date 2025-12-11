/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal } from 'types';
import type { AnyEntity } from 'singleTable/model/definitions';
import type { SingleTableParams } from 'singleTable/adaptor';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { baseParams, User } from './helpers.test';

describe('single table - from entity - query', () => {
  describe('query methods', () => {
    function queryInstance<
      T extends AnyEntity,
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
          propertiesToRetrieve: ['createdAt', 'email'],
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
          propertiesToRetrieve: ['createdAt', 'email'],
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

        type _R = Expect<
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;
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

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;

        type _R2 = Expect<
          Equal<typeof result, { items: NewUser890[]; paginationToken?: string }>
        >;
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

    describe('one', () => {
      function queryOneInstance<
        T extends AnyEntity,
        Params extends SingleTableParams | undefined,
      >(entity: T, params?: Params) {
        const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

        const result: User | undefined = {
          id: 'test-id',
          name: 'Test',
          email: 'test@test.com',
          address: '1',
          createdAt: '22',
          dob: '1',
        };

        const queryOne = jest.fn().mockResolvedValue(result);
        (instance as any).methods = { queryOne };

        return { instance, queryOne, expectedResult: result };
      }

      it('should work with entity partition key params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, queryOne, expectedResult } = queryOneInstance(user);

        const result = await instance.buildMethods().query.one({
          id: 'my-id',
        });

        expect(queryOne).toHaveBeenCalledTimes(1);
        expect(queryOne).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
        });
        expect(result).toEqual(expectedResult);

        // --- TYPES ---

        // @ts-expect-error id is required
        await instance.buildMethods().query.one();

        // @ts-expect-error id is required
        await instance.buildMethods().query.one({});

        // Should work with id
        await instance.buildMethods().query.one({ id: 'my-id' });
      });

      it('should work with entity with no key params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, queryOne, expectedResult } = queryOneInstance(user);

        const result = await instance.buildMethods().query.one();

        expect(queryOne).toHaveBeenCalledTimes(1);
        expect(queryOne).toHaveBeenCalledWith({
          partition: ['USERS'],
        });
        expect(result).toEqual(expectedResult);
      });

      it('should forward allowed query config params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, queryOne } = queryOneInstance(user);

        await instance.buildMethods().query.one({
          id: 'my-id',
          filters: { name: 'John' },
          retrieveOrder: 'DESC',
          propertiesToRetrieve: ['createdAt', 'email'],
          range: {
            operation: 'bigger_or_equal_than',
            value: '100',
          },
        });

        expect(queryOne).toHaveBeenCalledTimes(1);
        expect(queryOne).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          filters: { name: 'John' },
          propertiesToRetrieve: ['createdAt', 'email'],
          retrieveOrder: 'DESC',
          range: {
            operation: 'bigger_or_equal_than',
            value: '100',
          },
        });
      });

      it('[TYPES] should reject limit parameter', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryOneInstance(user);

        instance.buildMethods().query.one({
          id: 'my-id',
          // @ts-expect-error limit not allowed
          limit: 10,
        });
      });

      it('[TYPES] should reject paginationToken parameter', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryOneInstance(user);

        instance.buildMethods().query.one({
          id: 'my-id',
          // @ts-expect-error paginationToken not allowed
          paginationToken: 'token',
        });
      });

      it('[TYPES] should reject fullRetrieval parameter', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryOneInstance(user);

        instance.buildMethods().query.one({
          id: 'my-id',
          // @ts-expect-error fullRetrieval not allowed
          fullRetrieval: true,
        });
      });

      it('[TYPES] Return type should be Entity | undefined', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryOneInstance(user);

        const result = await instance.buildMethods().query.one({ id: 'my-id' });

        type _R = Expect<Equal<typeof result, User | undefined>>;
      });

      it('[TYPES] Extend: Return type should include extended properties', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
        });

        const { instance } = queryOneInstance(user);

        const result = await instance.buildMethods().query.one({ id: 'my-id' });

        interface NewUser extends User {
          newProperty: number;
        }

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, User | undefined>
        >;

        type _R2 = Expect<Equal<typeof result, NewUser | undefined>>;
      });
    });

    describe('all', () => {
      function queryAllInstance<
        T extends AnyEntity,
        Params extends SingleTableParams | undefined,
      >(entity: T, params?: Params) {
        const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

        const result: User[] = [
          {
            id: 'test-id-1',
            name: 'Test 1',
            email: 'test1@test.com',
            address: '1',
            createdAt: '22',
            dob: '1',
          },
          {
            id: 'test-id-2',
            name: 'Test 2',
            email: 'test2@test.com',
            address: '1',
            createdAt: '22',
            dob: '1',
          },
        ];

        const queryAll = jest.fn().mockResolvedValue(result);
        (instance as any).methods = { queryAll };

        return { instance, queryAll, expectedResult: result };
      }

      it('should work with entity partition key params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, queryAll, expectedResult } = queryAllInstance(user);

        const result = await instance.buildMethods().query.all({
          id: 'my-id',
        });

        expect(queryAll).toHaveBeenCalledTimes(1);
        expect(queryAll).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
        });
        expect(result).toEqual(expectedResult);

        // --- TYPES ---

        // @ts-expect-error id is required
        await instance.buildMethods().query.all();

        // @ts-expect-error id is required
        await instance.buildMethods().query.all({});

        // Should work with id
        await instance.buildMethods().query.all({ id: 'my-id' });
      });

      it('should work with entity with no key params', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: () => ['USERS'],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, queryAll, expectedResult } = queryAllInstance(user);

        const result = await instance.buildMethods().query.all();

        expect(queryAll).toHaveBeenCalledTimes(1);
        expect(queryAll).toHaveBeenCalledWith({
          partition: ['USERS'],
        });
        expect(result).toEqual(expectedResult);
      });

      it('should forward allowed query config params including limit', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance, queryAll } = queryAllInstance(user);

        await instance.buildMethods().query.all({
          id: 'my-id',
          filters: { name: 'John' },
          limit: 20,
          retrieveOrder: 'DESC',
          propertiesToRetrieve: ['createdAt', 'email'],
          range: {
            operation: 'bigger_or_equal_than',
            value: '100',
          },
        });

        expect(queryAll).toHaveBeenCalledTimes(1);
        expect(queryAll).toHaveBeenCalledWith({
          partition: ['USER', 'my-id'],
          filters: { name: 'John' },
          limit: 20,
          propertiesToRetrieve: ['createdAt', 'email'],
          retrieveOrder: 'DESC',
          range: {
            operation: 'bigger_or_equal_than',
            value: '100',
          },
        });
      });

      it('[TYPES] should reject paginationToken parameter', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryAllInstance(user);

        instance.buildMethods().query.all({
          id: 'my-id',
          // @ts-expect-error paginationToken not allowed
          paginationToken: 'token',
        });
      });

      it('[TYPES] should reject fullRetrieval parameter', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryAllInstance(user);

        instance.buildMethods().query.all({
          id: 'my-id',
          // @ts-expect-error fullRetrieval not allowed
          fullRetrieval: true,
        });
      });

      it('[TYPES] should accept limit parameter', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryAllInstance(user);

        // Should be valid
        instance.buildMethods().query.all({
          id: 'my-id',
          limit: 100,
        });
      });

      it('[TYPES] Return type should be Entity[]', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
        });

        const { instance } = queryAllInstance(user);

        const result = await instance.buildMethods().query.all({ id: 'my-id' });

        type _R = Expect<Equal<typeof result, User[]>>;
      });

      it('[TYPES] Extend: Return type should include extended properties', async () => {
        const schema = new SingleTableSchema(baseParams);

        const user = schema.createEntity<User>().as({
          type: 'USER',
          getPartitionKey: ({ id }: { id: string }) => ['USER', id],
          getRangeKey: () => ['#DATA'],
          extend: () => ({ newProperty: 10 }),
        });

        const { instance } = queryAllInstance(user);

        const result = await instance.buildMethods().query.all({ id: 'my-id' });

        interface NewUser extends User {
          newProperty: number;
        }

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, User[]>
        >;

        type _R2 = Expect<Equal<typeof result, NewUser[]>>;
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

        const result = await repo.query.someQuery({
          start: 'start',
          end: 'end',
          id: 'my-id',
        });

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

        const result = await repo.query.someQuery({
          start: 'start',
          end: 'end',
          id: 'my-id',
        });

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

        type _R = Expect<
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;
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

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;

        type _R2 = Expect<
          Equal<typeof result, { items: NewUser901[]; paginationToken?: string }>
        >;
      });

      describe('one', () => {
        function queryOneInstance<
          T extends AnyEntity,
          Params extends SingleTableParams | undefined,
        >(entity: T, params?: Params) {
          const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

          const result: User | undefined = {
            id: 'test-id',
            name: 'Test',
            email: 'test@test.com',
            address: '1',
            createdAt: '22',
            dob: '1',
          };

          const queryOne = jest.fn().mockResolvedValue(result);
          (instance as any).methods = { queryOne };

          return { instance, queryOne, expectedResult: result };
        }

        it('should work with range query and partition params', async () => {
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

          const { instance, queryOne, expectedResult } = queryOneInstance(user);

          const result = await instance
            .buildMethods()
            // @ts-expect-error params with id is required
            .query.someQuery.one({ id: 'my-id', fuck: 'you' });

          expect(queryOne).toHaveBeenCalledTimes(1);
          expect(queryOne).toHaveBeenCalledWith({
            partition: ['USER', 'my-id'],
            range: {
              operation: 'begins_with',
              value: '#DATA',
            },
          });
          expect(result).toEqual(expectedResult);

          // --- TYPES ---

          // @ts-expect-error params with id is required
          instance.buildMethods().query.someQuery.one();

          // @ts-expect-error params with id is required
          instance.buildMethods().query.someQuery.one({});
        });

        // it('should work with range query params', async () => {
        //   const schema = new SingleTableSchema(baseParams);

        //   const user = schema.createEntity<User>().as({
        //     type: 'USER',
        //     getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        //     getRangeKey: () => ['#DATA'],
        //     rangeQueries: {
        //       someQuery: {
        //         operation: 'begins_with',
        //         getValues: ({ someValue }: { someValue: string }) => ({
        //           value: ['#DATA', someValue],
        //         }),
        //       },
        //     },
        //   });

        //   const { instance, queryOne } = queryOneInstance(user);

        //   await instance
        //     .buildMethods()
        //     .query.someQuery.one({ id: 'my-id', someValue: 'CUSTOM!' });

        //   expect(queryOne).toHaveBeenCalledTimes(1);
        //   expect(queryOne).toHaveBeenCalledWith({
        //     partition: ['USER', 'my-id'],
        //     range: {
        //       operation: 'begins_with',
        //       value: ['#DATA', 'CUSTOM!'],
        //     },
        //   });

        //   // --- TYPES ---

        //   // @ts-expect-error params with id/someValue is required
        //   instance.buildMethods().query.someQuery.one();

        //   // @ts-expect-error id is required
        //   instance.buildMethods().query.someQuery.one({ someValue: '2390' });

        //   // @ts-expect-error someValue is required
        //   instance.buildMethods().query.someQuery.one({ id: '2390' });
        // });

        // it('should forward allowed query config params', async () => {
        //   const schema = new SingleTableSchema(baseParams);

        //   const user = schema.createEntity<User>().as({
        //     type: 'USER',
        //     getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        //     getRangeKey: () => ['#DATA'],
        //     rangeQueries: {
        //       someQuery: {
        //         operation: 'begins_with',
        //         getValues: () => ({ value: '#DATA' }),
        //       },
        //     },
        //   });

        //   const { instance, queryOne } = queryOneInstance(user);

        //   const params = {
        //     retrieveOrder: 'DESC' as const,
        //     filters: Symbol('unique-filters') as any,
        //   };

        //   await instance.buildMethods().query.someQuery.one({
        //     id: 'my-id',
        //     ...params,
        //   });

        //   expect(queryOne).toHaveBeenCalledWith({
        //     partition: ['USER', 'my-id'],
        //     range: {
        //       operation: 'begins_with',
        //       value: '#DATA',
        //     },
        //     ...params,
        //   });
        // });

        // it('[TYPES] should reject limit parameter', async () => {
        //   const schema = new SingleTableSchema(baseParams);

        //   const user = schema.createEntity<User>().as({
        //     type: 'USER',
        //     getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        //     getRangeKey: () => ['#DATA'],
        //     rangeQueries: {
        //       someQuery: {
        //         operation: 'begins_with',
        //         getValues: () => ({ value: '#DATA' }),
        //       },
        //     },
        //   });

        //   const { instance } = queryOneInstance(user);

        //   instance.buildMethods().query.someQuery.one({
        //     id: 'my-id',
        //     // @ts-expect-error limit not allowed
        //     limit: 10,
        //   });
        // });

        // it('[TYPES] should reject paginationToken parameter', async () => {
        //   const schema = new SingleTableSchema(baseParams);

        //   const user = schema.createEntity<User>().as({
        //     type: 'USER',
        //     getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        //     getRangeKey: () => ['#DATA'],
        //     rangeQueries: {
        //       someQuery: {
        //         operation: 'begins_with',
        //         getValues: () => ({ value: '#DATA' }),
        //       },
        //     },
        //   });

        //   const { instance } = queryOneInstance(user);

        //   instance.buildMethods().query.someQuery.one({
        //     id: 'my-id',
        //     // @ts-expect-error paginationToken not allowed
        //     paginationToken: 'token',
        //   });
        // });

        // it('[TYPES] Return type should be Entity | undefined', async () => {
        //   const schema = new SingleTableSchema(baseParams);

        //   const user = schema.createEntity<User>().as({
        //     type: 'USER',
        //     getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        //     getRangeKey: () => ['#DATA'],
        //     rangeQueries: {
        //       someQuery: {
        //         operation: 'begins_with',
        //         getValues: () => ({ value: '#DATA' }),
        //       },
        //     },
        //   });

        //   const { instance } = queryOneInstance(user);

        //   const result = await instance
        //     .buildMethods()
        //     .query.someQuery.one({ id: 'my-id' });

        //   type _R = Expect<Equal<typeof result, User | undefined>>;
        // });

        // it('[TYPES] Extend: Return type should include extended properties', async () => {
        //   const schema = new SingleTableSchema(baseParams);

        //   const user = schema.createEntity<User>().as({
        //     type: 'USER',
        //     getPartitionKey: ({ id }: { id: string }) => ['USER', id],
        //     getRangeKey: () => ['#DATA'],
        //     extend: () => ({ newProperty: 10 }),
        //     rangeQueries: {
        //       someQuery: {
        //         operation: 'begins_with',
        //         getValues: () => ({ value: '#DATA' }),
        //       },
        //     },
        //   });

        //   const { instance } = queryOneInstance(user);

        //   const result = await instance
        //     .buildMethods()
        //     .query.someQuery.one({ id: 'my-id' });

        //   interface NewUser extends User {
        //     newProperty: number;
        //   }

        //   type _R = Expect<
        //     // @ts-expect-error User is not enough
        //     Equal<typeof result, User | undefined>
        //   >;

        //   type _R2 = Expect<Equal<typeof result, NewUser | undefined>>;
        // });
      });

      describe('all', () => {
        function queryAllInstance<
          T extends AnyEntity,
          Params extends SingleTableParams | undefined,
        >(entity: T, params?: Params) {
          const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

          const result: User[] = [
            {
              id: 'test-id-1',
              name: 'Test 1',
              email: 'test1@test.com',
              address: '1',
              createdAt: '22',
              dob: '1',
            },
            {
              id: 'test-id-2',
              name: 'Test 2',
              email: 'test2@test.com',
              address: '1',
              createdAt: '22',
              dob: '1',
            },
          ];

          const queryAll = jest.fn().mockResolvedValue(result);
          (instance as any).methods = { queryAll };

          return { instance, queryAll, expectedResult: result };
        }

        it('should work with range query and partition params', async () => {
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

          const { instance, queryAll, expectedResult } = queryAllInstance(user);

          const result = await instance
            .buildMethods()
            .query.someQuery.all({ id: 'my-id' });

          expect(queryAll).toHaveBeenCalledTimes(1);
          expect(queryAll).toHaveBeenCalledWith({
            partition: ['USER', 'my-id'],
            range: {
              operation: 'begins_with',
              value: '#DATA',
            },
          });
          expect(result).toEqual(expectedResult);

          // --- TYPES ---

          // @ts-expect-error params with id is required
          instance.buildMethods().query.someQuery.all();

          // @ts-expect-error params with id is required
          instance.buildMethods().query.someQuery.all({});
        });

        it('should work with range query params', async () => {
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

          const { instance, queryAll } = queryAllInstance(user);

          await instance
            .buildMethods()
            .query.someQuery.all({ id: 'my-id', someValue: 'CUSTOM!' });

          expect(queryAll).toHaveBeenCalledTimes(1);
          expect(queryAll).toHaveBeenCalledWith({
            partition: ['USER', 'my-id'],
            range: {
              operation: 'begins_with',
              value: ['#DATA', 'CUSTOM!'],
            },
          });

          // --- TYPES ---

          // @ts-expect-error params with id/someValue is required
          instance.buildMethods().query.someQuery.all();

          // @ts-expect-error id is required
          instance.buildMethods().query.someQuery.all({ someValue: '2390' });

          // @ts-expect-error someValue is required
          instance.buildMethods().query.someQuery.all({ id: '2390' });
        });

        it('should forward allowed query config params including limit', async () => {
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

          const { instance, queryAll } = queryAllInstance(user);

          const params = {
            limit: 10,
            retrieveOrder: 'DESC' as const,
            filters: Symbol('unique-filters') as any,
          };

          await instance.buildMethods().query.someQuery.all({
            id: 'my-id',
            ...params,
          });

          expect(queryAll).toHaveBeenCalledWith({
            partition: ['USER', 'my-id'],
            range: {
              operation: 'begins_with',
              value: '#DATA',
            },
            ...params,
          });
        });

        it('[TYPES] should reject paginationToken parameter', async () => {
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

          const { instance } = queryAllInstance(user);

          instance.buildMethods().query.someQuery.all({
            id: 'my-id',
            // @ts-expect-error paginationToken not allowed
            paginationToken: 'token',
          });
        });

        it('[TYPES] should accept limit parameter', async () => {
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

          const { instance } = queryAllInstance(user);

          // Should be valid
          instance.buildMethods().query.someQuery.all({
            id: 'my-id',
            limit: 100,
          });
        });

        it('[TYPES] Return type should be Entity[]', async () => {
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

          const { instance } = queryAllInstance(user);

          const result = await instance
            .buildMethods()
            .query.someQuery.all({ id: 'my-id' });

          type _R = Expect<Equal<typeof result, User[]>>;
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

          const { instance } = queryAllInstance(user);

          const result = await instance
            .buildMethods()
            .query.someQuery.all({ id: 'my-id' });

          interface NewUser extends User {
            newProperty: number;
          }

          type _R = Expect<
            // @ts-expect-error User is not enough
            Equal<typeof result, User[]>
          >;

          type _R2 = Expect<Equal<typeof result, NewUser[]>>;
        });
      });
    });
  });

  describe('query index methods', () => {
    function queryInstance<
      T extends AnyEntity,
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

        type _R = Expect<
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;
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

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;

        type _R2 = Expect<
          Equal<typeof result, { items: NewUser912[]; paginationToken?: string }>
        >;
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

    describe('one', () => {
      function queryOneInstance<
        T extends AnyEntity,
        Params extends SingleTableParams | undefined,
      >(entity: T, params?: Params) {
        const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

        const result: User | undefined = {
          id: 'test-id',
          name: 'Test',
          email: 'test@test.com',
          address: '1',
          createdAt: '22',
          dob: '1',
        };

        const queryOne = jest.fn().mockResolvedValue(result);
        (instance as any).methods = { queryOne };

        return { instance, queryOne, expectedResult: result };
      }

      it('should work with index partition key params', async () => {
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

        const { instance, queryOne, expectedResult } = queryOneInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.one({
          email: 'test@example.com',
        });

        expect(queryOne).toHaveBeenCalledTimes(1);
        expect(queryOne).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL', 'test@example.com'],
          index: 'anotherIndex',
        });
        expect(result).toEqual(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.one();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.one({});
      });

      it('should work with index with no key params', async () => {
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

        const { instance, queryOne, expectedResult } = queryOneInstance(user);

        const result = await instance.buildMethods().queryIndex.byStatus.one();

        expect(queryOne).toHaveBeenCalledTimes(1);
        expect(queryOne).toHaveBeenCalledWith({
          partition: ['USERS_BY_STATUS'],
          index: 'anotherIndex',
        });
        expect(result).toEqual(expectedResult);
      });

      it('should forward allowed query config params', async () => {
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

        const { instance, queryOne } = queryOneInstance(user);

        await instance.buildMethods().queryIndex.byEmail.one({
          filters: { name: 'John' },
          retrieveOrder: 'DESC',
          range: {
            operation: 'begins_with',
            value: 'test@',
          },
        });

        expect(queryOne).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL'],
          index: 'anotherIndex',
          filters: { name: 'John' },
          retrieveOrder: 'DESC',
          range: {
            operation: 'begins_with',
            value: 'test@',
          },
        });
      });

      it('[TYPES] should reject limit parameter', async () => {
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

        const { instance } = queryOneInstance(user);

        instance.buildMethods().queryIndex.byEmail.one({
          // @ts-expect-error limit not allowed
          limit: 10,
        });
      });

      it('[TYPES] should reject paginationToken parameter', async () => {
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

        const { instance } = queryOneInstance(user);

        instance.buildMethods().queryIndex.byEmail.one({
          // @ts-expect-error paginationToken not allowed
          paginationToken: 'token',
        });
      });

      it('[TYPES] Return type should be Entity | undefined', async () => {
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

        const { instance } = queryOneInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.one();

        type _R = Expect<Equal<typeof result, User | undefined>>;
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

        const { instance } = queryOneInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.one();

        interface NewUser extends User {
          newProperty: number;
        }

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, User | undefined>
        >;

        type _R2 = Expect<Equal<typeof result, NewUser | undefined>>;
      });
    });

    describe('all', () => {
      function queryAllInstance<
        T extends AnyEntity,
        Params extends SingleTableParams | undefined,
      >(entity: T, params?: Params) {
        const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

        const result: User[] = [
          {
            id: 'test-id-1',
            name: 'Test 1',
            email: 'test1@test.com',
            address: '1',
            createdAt: '22',
            dob: '1',
          },
          {
            id: 'test-id-2',
            name: 'Test 2',
            email: 'test2@test.com',
            address: '1',
            createdAt: '22',
            dob: '1',
          },
        ];

        const queryAll = jest.fn().mockResolvedValue(result);
        (instance as any).methods = { queryAll };

        return { instance, queryAll, expectedResult: result };
      }

      it('should work with index partition key params', async () => {
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

        const { instance, queryAll, expectedResult } = queryAllInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.all({
          email: 'test@example.com',
        });

        expect(queryAll).toHaveBeenCalledTimes(1);
        expect(queryAll).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL', 'test@example.com'],
          index: 'anotherIndex',
        });
        expect(result).toEqual(expectedResult);

        // --- TYPES ---

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.all();

        // @ts-expect-error email is required
        instance.buildMethods().queryIndex.byEmail.all({});
      });

      it('should work with index with no key params', async () => {
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

        const { instance, queryAll, expectedResult } = queryAllInstance(user);

        const result = await instance.buildMethods().queryIndex.byStatus.all();

        expect(queryAll).toHaveBeenCalledTimes(1);
        expect(queryAll).toHaveBeenCalledWith({
          partition: ['USERS_BY_STATUS'],
          index: 'anotherIndex',
        });
        expect(result).toEqual(expectedResult);
      });

      it('should forward allowed query config params including limit', async () => {
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

        const { instance, queryAll } = queryAllInstance(user);

        await instance.buildMethods().queryIndex.byEmail.all({
          filters: { name: 'John' },
          limit: 20,
          retrieveOrder: 'DESC',
          range: {
            operation: 'begins_with',
            value: 'test@',
          },
        });

        expect(queryAll).toHaveBeenCalledWith({
          partition: ['USERS_BY_EMAIL'],
          index: 'anotherIndex',
          filters: { name: 'John' },
          limit: 20,
          retrieveOrder: 'DESC',
          range: {
            operation: 'begins_with',
            value: 'test@',
          },
        });
      });

      it('[TYPES] should reject paginationToken parameter', async () => {
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

        const { instance } = queryAllInstance(user);

        instance.buildMethods().queryIndex.byEmail.all({
          // @ts-expect-error paginationToken not allowed
          paginationToken: 'token',
        });
      });

      it('[TYPES] should accept limit parameter', async () => {
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

        const { instance } = queryAllInstance(user);

        // Should be valid
        instance.buildMethods().queryIndex.byEmail.all({
          limit: 100,
        });
      });

      it('[TYPES] Return type should be Entity[]', async () => {
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

        const { instance } = queryAllInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.all();

        type _R = Expect<Equal<typeof result, User[]>>;
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

        const { instance } = queryAllInstance(user);

        const result = await instance.buildMethods().queryIndex.byEmail.all();

        interface NewUser extends User {
          newProperty: number;
        }

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, User[]>
        >;

        type _R2 = Expect<Equal<typeof result, NewUser[]>>;
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

        instance
          .buildMethods()
          // @ts-expect-error prefix is required
          .queryIndex.byEmailProvider.startingWith({ email: 't@t.com' });
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

        type _R = Expect<
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;
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

        type _R = Expect<
          // @ts-expect-error User is not enough
          Equal<typeof result, { items: User[]; paginationToken?: string }>
        >;

        type _R2 = Expect<
          Equal<typeof result, { items: NewUser923[]; paginationToken?: string }>
        >;
      });

      describe('one', () => {
        function queryOneInstance<
          T extends AnyEntity,
          Params extends SingleTableParams | undefined,
        >(entity: T, params?: Params) {
          const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

          const result: User | undefined = {
            id: 'test-id',
            name: 'Test',
            email: 'test@test.com',
            address: '1',
            createdAt: '22',
            dob: '1',
          };

          const queryOne = jest.fn().mockResolvedValue(result);
          (instance as any).methods = { queryOne };

          return { instance, queryOne, expectedResult: result };
        }

        it('should work with index range query and partition params', async () => {
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

          const { instance, queryOne, expectedResult } = queryOneInstance(user);

          const result = await instance
            .buildMethods()
            .queryIndex.byEmail.startingWith.one({
              email: 'test@example.com',
              prefix: 'k',
            });

          expect(queryOne).toHaveBeenCalledTimes(1);
          expect(queryOne).toHaveBeenCalledWith({
            partition: ['USERS_BY_EMAIL', 'test@example.com'],
            index: 'anotherIndex',
            range: {
              operation: 'begins_with',
              value: 'k',
            },
          });
          expect(result).toEqual(expectedResult);

          // --- TYPES ---

          // @ts-expect-error email/prefix is required
          instance.buildMethods().queryIndex.byEmail.startingWith.one();

          // @ts-expect-error email is required
          instance.buildMethods().queryIndex.byEmail.startingWith.one({ prefix: 'k' });

          instance
            .buildMethods()
            // @ts-expect-error prefix is required
            .queryIndex.byEmail.startingWith.one({ email: 't@t.com' });
        });

        it('should forward allowed query config params', async () => {
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

          const { instance, queryOne } = queryOneInstance(user);

          await instance.buildMethods().queryIndex.byEmail.aToF.one({
            retrieveOrder: 'DESC',
            filters: { name: 'John' },
          });

          expect(queryOne).toHaveBeenCalledWith({
            partition: ['USERS_BY_EMAIL'],
            index: 'anotherIndex',
            range: {
              operation: 'between',
              end: 'f',
              start: 'a',
            },
            retrieveOrder: 'DESC',
            filters: { name: 'John' },
          });
        });

        it('[TYPES] should reject limit parameter', async () => {
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

          const { instance } = queryOneInstance(user);

          instance.buildMethods().queryIndex.byEmail.aToF.one({
            // @ts-expect-error limit not allowed
            limit: 10,
          });
        });

        it('[TYPES] should reject paginationToken parameter', async () => {
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

          const { instance } = queryOneInstance(user);

          instance.buildMethods().queryIndex.byEmail.aToF.one({
            // @ts-expect-error paginationToken not allowed
            paginationToken: 'token',
          });
        });

        it('[TYPES] Return type should be Entity | undefined', async () => {
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

          const { instance } = queryOneInstance(user);

          const result = await instance.buildMethods().queryIndex.byEmail.aToF.one();

          type _R = Expect<Equal<typeof result, User | undefined>>;
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

          const { instance } = queryOneInstance(user);

          const result = await instance.buildMethods().queryIndex.byEmail.aToF.one();

          interface NewUser extends User {
            newProperty: number;
          }

          type _R = Expect<
            // @ts-expect-error User is not enough
            Equal<typeof result, User | undefined>
          >;

          type _R2 = Expect<Equal<typeof result, NewUser | undefined>>;
        });
      });

      describe('all', () => {
        function queryAllInstance<
          T extends AnyEntity,
          Params extends SingleTableParams | undefined,
        >(entity: T, params?: Params) {
          const instance = new SingleTableFromEntityMethods(entity, params ?? baseParams);

          const result: User[] = [
            {
              id: 'test-id-1',
              name: 'Test 1',
              email: 'test1@test.com',
              address: '1',
              createdAt: '22',
              dob: '1',
            },
            {
              id: 'test-id-2',
              name: 'Test 2',
              email: 'test2@test.com',
              address: '1',
              createdAt: '22',
              dob: '1',
            },
          ];

          const queryAll = jest.fn().mockResolvedValue(result);
          (instance as any).methods = { queryAll };

          return { instance, queryAll, expectedResult: result };
        }

        it('should work with index range query and partition params', async () => {
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

          const { instance, queryAll, expectedResult } = queryAllInstance(user);

          const result = await instance
            .buildMethods()
            .queryIndex.byEmail.startingWith.all({
              email: 'test@example.com',
              prefix: 'k',
            });

          expect(queryAll).toHaveBeenCalledTimes(1);
          expect(queryAll).toHaveBeenCalledWith({
            partition: ['USERS_BY_EMAIL', 'test@example.com'],
            index: 'anotherIndex',
            range: {
              operation: 'begins_with',
              value: 'k',
            },
          });
          expect(result).toEqual(expectedResult);

          // --- TYPES ---

          // @ts-expect-error email/prefix is required
          instance.buildMethods().queryIndex.byEmail.startingWith.all();

          // @ts-expect-error email is required
          instance.buildMethods().queryIndex.byEmail.startingWith.all({ prefix: 'k' });

          instance
            .buildMethods()
            // @ts-expect-error prefix is required
            .queryIndex.byEmail.startingWith.all({ email: 't@t.com' });
        });

        it('should forward allowed query config params including limit', async () => {
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

          const { instance, queryAll } = queryAllInstance(user);

          await instance.buildMethods().queryIndex.byEmail.aToF.all({
            limit: 10,
            retrieveOrder: 'DESC',
            filters: { name: 'John' },
          });

          expect(queryAll).toHaveBeenCalledWith({
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

        it('[TYPES] should reject paginationToken parameter', async () => {
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

          const { instance } = queryAllInstance(user);

          instance.buildMethods().queryIndex.byEmail.aToF.all({
            // @ts-expect-error paginationToken not allowed
            paginationToken: 'token',
          });
        });

        it('[TYPES] should accept limit parameter', async () => {
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

          const { instance } = queryAllInstance(user);

          // Should be valid
          instance.buildMethods().queryIndex.byEmail.aToF.all({
            limit: 100,
          });
        });

        it('[TYPES] Return type should be Entity[]', async () => {
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

          const { instance } = queryAllInstance(user);

          const result = await instance.buildMethods().queryIndex.byEmail.aToF.all();

          type _R = Expect<Equal<typeof result, User[]>>;
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

          const { instance } = queryAllInstance(user);

          const result = await instance.buildMethods().queryIndex.byEmail.aToF.all();

          interface NewUser extends User {
            newProperty: number;
          }

          type _R = Expect<
            // @ts-expect-error User is not enough
            Equal<typeof result, User[]>
          >;

          type _R2 = Expect<Equal<typeof result, NewUser[]>>;
        });
      });
    });
  });
});
