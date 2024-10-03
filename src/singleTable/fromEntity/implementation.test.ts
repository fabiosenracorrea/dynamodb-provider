/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableFromEntity } from './implementation';
import { SingleTableSchema } from '../model';

type User = {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
};

describe('single table - from entity methods', () => {
  describe('get', () => {
    it('should work with entity key params', async () => {
      const params = {
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

      const get = jest.fn();

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          get,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).get({
        id: 'my-id',
      });

      expect(get).toHaveBeenCalled();
      expect(get).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: ['USER', 'my-id'].join('#'),
          [params.rangeKey]: '#DATA',
        },
      });
    });

    it('should work with entity with no key params', async () => {
      const params = {
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

      const get = jest.fn();

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          get,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: () => ['USER'],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).get();

      expect(get).toHaveBeenCalled();
      expect(get).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: 'USER',
          [params.rangeKey]: '#DATA',
        },
      });
    });

    it('should forward config parmas', async () => {
      const params = {
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

      const get = jest.fn();

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          get,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).get({
        id: 'my-id',

        consistentRead: true,
        propertiesToRetrieve: ['name'],
      });

      expect(get).toHaveBeenCalled();
      expect(get).toHaveBeenCalledWith({
        table: params.table,

        key: {
          [params.partitionKey]: ['USER', 'my-id'].join('#'),
          [params.rangeKey]: '#DATA',
        },

        consistentRead: true,
        propertiesToRetrieve: ['name'],
      });
    });
  });

  describe('batch-get', () => {
    it('should properly get keys converted', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          batchGet,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).batchGet({
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          batchGet,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).batchGet({
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          delete: deleteMock,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).delete({
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          delete: deleteMock,
        } as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).delete({
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {
          create,
        } as any,
      });

      (instance as any).methods = {
        create,
      };

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

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

      await instance.fromEntity(user).create(createUser);

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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      (instance as any).methods = {
        create,
      };

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

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

      await instance.fromEntity(user).create(createUser, {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const update = jest.fn();

      (instance as any).methods = {
        update,
      };

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const getUpdateParams = jest.fn().mockReturnValue({
        update: 'here!',
      });

      user.getUpdateParams = getUpdateParams;

      const forwardParams = Symbol('update-params');

      await instance.fromEntity(user).update(forwardParams as any);

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
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const repo = instance.fromEntity(user);

      expect((repo as any).list).toBe(undefined);
      expect((repo as any).listAll).toBe(undefined);
    });

    it('listAll - should simply call listAllFromType from adaptor', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const mockReturn = ['MOCK_DATA'];

      const listAllFromType = jest.fn().mockResolvedValue(mockReturn);

      (instance as any).methods = {
        listAllFromType,
      };

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const result = await instance.fromEntity(user).listAll();

      expect(listAllFromType).toHaveBeenCalled();
      expect(listAllFromType).toHaveBeenCalledWith('USER');
      expect(result).toBe(mockReturn);
    });

    it('list - should simply call listType from adaptor', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
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

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const result = await instance.fromEntity(user).list();

      expect(listType).toHaveBeenCalled();
      expect(listType).toHaveBeenCalledWith({
        type: 'USER',
      });

      expect(result).toBe(mockResult);
    });

    it('list - should properly forward configs', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const listType = jest.fn();

      (instance as any).methods = {
        listType,
      };

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      await instance.fromEntity(user).list({
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
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.fromEntity(user).query.custom({
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
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.fromEntity(user).query.custom({
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
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
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

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const repo = instance.fromEntity(user);

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
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
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

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const repo = instance.fromEntity(user);

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
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',
      };

      const schema = new SingleTableSchema(params);

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      const repo = instance.fromEntity(user);

      expect((repo as any).queryIndex).toBe(undefined);
    });

    it('should have a custom query on each index', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
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

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.fromEntity(user).queryIndex.byEmail.custom();

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_EMAIL'],

        index: 'anotherIndex',
      });

      expect(result).toBe(mockResult);

      const result2 = await instance.fromEntity(user).queryIndex.byName.custom();

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_NAME'],

        index: 'someIndex',
      });

      expect(result2).toBe(mockResult);
    });

    it('should handle a custom query for an index partition with params', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
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

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.fromEntity(user).queryIndex.byEmailProvider.custom({
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
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
                  high: 'f',
                  low: 'a',
                }),
              },
            },
          },
        },
      });

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.fromEntity(user).queryIndex.byEmailProvider.aToF({
        email: 'some@gmail.com',
      });

      expect(query).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({
        partition: ['USERS_BY_EMAIL_PROVIDER', 'gmail.com'],

        index: 'anotherIndex',

        range: {
          operation: 'between',
          high: 'f',
          low: 'a',
        },
      });

      expect(result).toBe(mockResult);
    });

    it('should handle a range query with params', async () => {
      const params = {
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

      const instance = new SingleTableFromEntity({
        ...params,

        dynamodbProvider: {} as any,
      });

      const user = schema.create<User>().entity({
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

      const mockResult = Symbol('query-result');

      const query = jest.fn().mockResolvedValue(mockResult);

      (instance as any).methods = {
        query,
      };

      const result = await instance.fromEntity(user).queryIndex.byEmailProvider.startingWith({
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
