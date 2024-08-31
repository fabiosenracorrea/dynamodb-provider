/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableUpdater } from './update';

describe('single table adaptor - update', () => {
  // This tests guards the update method to be a simple proxy of db.update+updater.getParams
  // all the required logic to ensure its working is withing the param getter tests
  describe('updater', () => {
    it('should simply build the params and pass in to db provider method', async () => {
      const result = { value: 'Fake result to ensure db provider return is returned' };

      const updateMock = jest.fn().mockResolvedValue(result);

      const updater = new SingleTableUpdater({
        db: {
          update: updateMock,
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

      const builtParams = {
        value: 'simply fake params to ensure its whats gets passed',
      };

      const paramGetter = jest.fn().mockReturnValue(builtParams);

      updater.getUpdateParams = paramGetter;

      const updateResult = await updater.update({
        partitionKey: 'some',
        rangeKey: 'other_pk',

        values: {
          prop: 'value',
          name: 'hello',
        },
      });

      expect(paramGetter).toHaveBeenCalled();
      expect(paramGetter).toHaveBeenCalledWith({
        partitionKey: 'some',
        rangeKey: 'other_pk',

        values: {
          prop: 'value',
          name: 'hello',
        },
      });

      expect(updateMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith(builtParams);

      expect(updateResult).toBe(result);
    });
  });

  describe('get update params', () => {
    it('should properly create the standard params', () => {
      const updater = new SingleTableUpdater({
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

      const params = updater.getUpdateParams({
        partitionKey: 'some',
        rangeKey: 'other_pk',

        values: {
          prop: 'value',
          name: 'hello',
        },
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },

        values: {
          prop: 'value',
          name: 'hello',
        },
      });
    });

    it('should properly forward atomicOperations, conditions, remove, returnUpdatedProperties', () => {
      const updater = new SingleTableUpdater({
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

      const toForward = {
        atomicOperations: [{ operation: 'equal' }],
        conditions: [{ operation: 'between' }],
        remove: ['some', 'prop'],
        returnUpdatedProperties: true,
      } as any;

      const params = updater.getUpdateParams({
        partitionKey: 'some',
        rangeKey: 'other_pk',

        values: {
          prop: 'value',
          name: 'hello',
        },

        ...toForward,
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },

        values: {
          prop: 'value',
          name: 'hello',
        },

        ...toForward,
      });
    });

    it('should handle expiresAt if applicable', () => {
      const updater = new SingleTableUpdater({
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
          expiresAt: '_expires',
        },
      });

      const toForward = {
        atomicOperations: [{ operation: 'equal' }],
        conditions: [{ operation: 'between' }],
        remove: ['some', 'prop'],
        returnUpdatedProperties: true,
      } as any;

      const params = updater.getUpdateParams({
        partitionKey: 'some',
        rangeKey: 'other_pk',

        values: {
          prop: 'value',
          name: 'hello',
        },

        ...toForward,

        expiresAt: 2302930,
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },

        values: {
          prop: 'value',
          name: 'hello',
          _expires: 2302930,
        },

        ...toForward,
      });
    });

    it('should handle indexes if applicable', () => {
      const updater = new SingleTableUpdater({
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
        },
      });

      const toForward = {
        atomicOperations: [{ operation: 'equal' }],
        conditions: [{ operation: 'between' }],
        remove: ['some', 'prop'],
        returnUpdatedProperties: true,
      } as any;

      const params = updater.getUpdateParams({
        partitionKey: 'some',
        rangeKey: 'other_pk',

        values: {
          prop: 'value',
          name: 'hello',
        },

        ...toForward,

        expiresAt: 2302930,

        indexes: {
          someIndex: {
            partitionKey: 'index value 1',
            rangeKey: 'index range 1',
          },
          anotherIndex: {
            rangeKey: 'index range 2',
          },
        },
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'some',
          _sk: 'other_pk',
        },

        values: {
          prop: 'value',
          name: 'hello',
          _expires: 2302930,
          _indexHash1: 'index value 1',
          _indexRange1: 'index range 1',
          _indexRange2: 'index range 2',
        },

        ...toForward,
      });
    });
  });
});
