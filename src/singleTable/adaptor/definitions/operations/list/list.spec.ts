/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableLister } from './list';

describe('single table - lister', () => {
  describe('list all', () => {
    it('should properly build the database query', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listAllFromType('SOME_TYPE');

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: true,

        index: 'TypeIndexName',
      });
    });

    it('should remove db properties', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      const items = await lister.listAllFromType('SOME_TYPE');

      expect(items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should keep type prop if configured', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          keepTypeProperty: true,
        },
      });

      const items = await lister.listAllFromType('SOME_TYPE');

      expect(items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
          _type: 'SOME_TYPE',
        },
        {
          _type: 'SOME_TYPE',
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should keep props based on remover if configured', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          propertyCleanup: ({ _sk, _type, ...item }) => item,
        },
      });

      const items = await lister.listAllFromType('SOME_TYPE');

      expect(items).toStrictEqual([
        {
          _pk: 'some',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          _pk: 'some',
          _ts: '1233',
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should apply _parser_ if present', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },

        parser: (data) => ({
          ...data,
          extraProp: 'yes!',
        }),
      });

      const items = await lister.listAllFromType('SOME_TYPE');

      expect(items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
          extraProp: 'yes!',
        },
        {
          id: '2',
          name: 'some1',
          other: 'prop--',
          extraProp: 'yes!',
        },
      ]);
    });
  });

  describe('list type', () => {
    it('should properly call the db query', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: false,

        index: 'TypeIndexName',
      });
    });

    it('should handle range query operations', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',

        range: {
          operation: 'equal',
          value: 'some',
        },
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: false,

        index: 'TypeIndexName',

        rangeKey: {
          operation: 'equal',
          name: '_ts',
          value: 'some',
        },
      });
    });

    it('should handle range filter operations', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',

        range: {
          operation: 'equal',
          value: 'some',
        },

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: false,

        index: 'TypeIndexName',

        rangeKey: {
          operation: 'equal',
          name: '_ts',
          value: 'some',
        },

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });
    });

    it('should handle paginationToken', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',

        range: {
          operation: 'equal',
          value: 'some',
        },

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: false,

        index: 'TypeIndexName',

        rangeKey: {
          operation: 'equal',
          name: '_ts',
          value: 'some',
        },

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });
    });

    it('should handle order param', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',

        range: {
          operation: 'equal',
          value: 'some',
        },

        retrieveOrder: 'DESC',

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: false,

        index: 'TypeIndexName',

        rangeKey: {
          operation: 'equal',
          name: '_ts',
          value: 'some',
        },

        retrieveOrder: 'DESC',

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });
    });

    it('should handle LIMIT param', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',

        range: {
          operation: 'equal',
          value: 'some',
        },

        retrieveOrder: 'DESC',

        limit: 10,

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: false,

        index: 'TypeIndexName',

        limit: 10,

        rangeKey: {
          operation: 'equal',
          name: '_ts',
          value: 'some',
        },

        retrieveOrder: 'DESC',

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });
    });

    it('should handle fullRetrieval param', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      await lister.listType({
        type: 'SOME_TYPE',

        range: {
          operation: 'equal',
          value: 'some',
        },

        retrieveOrder: 'DESC',

        fullRetrieval: true,

        limit: 10,

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });

      expect(queryMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith({
        table: 'db-table',

        partitionKey: {
          value: 'SOME_TYPE',
          name: '_type',
        },

        fullRetrieval: true,

        index: 'TypeIndexName',

        limit: 10,

        rangeKey: {
          operation: 'equal',
          name: '_ts',
          value: 'some',
        },

        retrieveOrder: 'DESC',

        paginationToken: 'fake token',

        filters: {
          count: {
            operation: 'bigger_than',
            value: 0,
          },

          status: ['0', '1'],

          deleted: false,
        },
      });
    });

    it('should remove db properties', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      const { items } = await lister.listType({
        type: 'SOME_TYPE',
      });

      expect(items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should keep type prop if configured', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          keepTypeProperty: true,
        },
      });

      const { items } = await lister.listType({
        type: 'SOME_TYPE',
      });

      expect(items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
          _type: 'SOME_TYPE',
        },
        {
          _type: 'SOME_TYPE',
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should keep props based on remover if configured', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          propertyCleanup: ({ _sk, _type, ...item }) => item,
        },
      });

      const { items } = await lister.listType({
        type: 'SOME_TYPE',
      });

      expect(items).toStrictEqual([
        {
          _pk: 'some',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          _pk: 'some',
          _ts: '1233',
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should return paginationToken if applicable', async () => {
      const paginationToken = 'FAKE';

      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],

        paginationToken,
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },
      });

      const result = await lister.listType({
        type: 'SOME_TYPE',
      });

      expect(result.paginationToken).toBe(paginationToken);

      expect(result.items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          id: '2',
          name: 'some1',
          other: 'prop--',
        },
      ]);
    });

    it('should apply _parser_ if present', async () => {
      const queryMock = jest.fn().mockResolvedValue({
        items: [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
          {
            _pk: 'some',
            _sk: 'other2',
            _type: 'SOME_TYPE',
            _ts: '1233',
            id: '2',
            name: 'some1',
            other: 'prop--',
          },
        ],
      });

      const lister = new SingleTableLister({
        db: {
          query: queryMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        },

        parser: (data) => ({
          ...data,
          extraProp: 'yes!',
        }),
      });

      const { items } = await lister.listType({
        type: 'SOME_TYPE',
      });

      expect(items).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
          extraProp: 'yes!',
        },
        {
          id: '2',
          name: 'some1',
          other: 'prop--',
          extraProp: 'yes!',
        },
      ]);
    });
  });
});
