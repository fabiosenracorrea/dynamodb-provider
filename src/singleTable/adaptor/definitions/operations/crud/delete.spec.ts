/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableRemover } from './delete';

describe('single table adaptor - delete', () => {
  describe('delete action', () => {
    it('should properly call the db provider operation', async () => {
      const deleteMock = jest.fn();

      const remover = new SingleTableRemover({
        db: {
          delete: deleteMock,
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

      await remover.delete({
        partitionKey: 'some',
        rangeKey: 'other_pk',
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledWith({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },
      });
    });

    it('should forward conditions if provided', async () => {
      const deleteMock = jest.fn();

      const remover = new SingleTableRemover({
        db: {
          delete: deleteMock,
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

      await remover.delete({
        partitionKey: 'some',
        rangeKey: 'other_pk',
        conditions: [
          {
            operation: 'begins_with',
            property: 'some',
            value: 'locked',
          },
        ],
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledWith({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },

        conditions: [
          {
            operation: 'begins_with',
            property: 'some',
            value: 'locked',
          },
        ],
      });
    });
  });

  describe('param generator', () => {
    it('should properly generate the basic db provider param', async () => {
      const remover = new SingleTableRemover({
        db: {} as any,

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

      const params = await remover.getDeleteParams({ partitionKey: 'some', rangeKey: 'other_pk' });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },
      });
    });

    it('should include the conditions if provided', async () => {
      const remover = new SingleTableRemover({
        db: {} as any,

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

      const params = await remover.getDeleteParams({
        partitionKey: 'some',
        rangeKey: 'other_pk',
        conditions: [
          {
            operation: 'begins_with',
            property: 'some',
            value: 'locked',
          },
        ],
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },

        conditions: [
          {
            operation: 'begins_with',
            property: 'some',
            value: 'locked',
          },
        ],
      });
    });
  });
});
