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

        hashKey: {
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

        hashKey: {
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

        hashKey: {
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
  });
});
