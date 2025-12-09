/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableUpdater } from './update';

describe('single table adaptor - update', () => {
  // This tests guards the update method to be a simple proxy of db.update+updater.getParams
  // all the required logic to ensure its working is withing the param getter tests
  describe('updater', () => {
    it('should not return if _returnUpdatedProperties_ is not specified', async () => {
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

      expect(updateResult).toBe(undefined);
    });

    it('should return if _returnUpdatedProperties_ is  specified', async () => {
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

        returnUpdatedProperties: true,
      });

      expect(paramGetter).toHaveBeenCalled();
      expect(paramGetter).toHaveBeenCalledWith({
        partitionKey: 'some',
        rangeKey: 'other_pk',
        returnUpdatedProperties: true,

        values: {
          prop: 'value',
          name: 'hello',
        },
      });

      expect(updateMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith(builtParams);

      expect(updateResult).toEqual(result);
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

    it('should block all internal properties mentioned on any update by default', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          expiresAt: '_expires',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          indexes: {
            someIndex: {
              partitionKey: '_i1',
              rangeKey: '_ir1',
            },
          },
        },
      });

      const props = ['_pk', '_sk', '_expires', '_type', '_ts', '_i1', '_ir1'];

      props.forEach((badProp) => {
        const onValue = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            values: {
              [badProp]: 'some-update',
            },
          });
        };

        const onRemove = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            remove: [badProp],
          });
        };

        const onAtomic = () => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            atomicOperations: [
              {
                property: badProp,
                type: 'add' as const,
                value: 1,
              },
            ],
          });
        };

        expect(onValue).toThrow();
        expect(onRemove).toThrow();
        expect(onAtomic).toThrow();
      });
    });

    it('should only block PK references if blockInternalPropUpdate is false', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          blockInternalPropUpdate: false,
          expiresAt: '_expires',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          indexes: {
            someIndex: {
              partitionKey: '_i1',
              rangeKey: '_ir1',
            },
          },
        },
      });

      const props = ['_expires', '_type', '_ts', '_i1', '_ir1'];
      const badProps = ['_pk', '_sk'];

      props.forEach((okProp) => {
        const onValue = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            values: {
              [okProp]: 'some-update',
            },
          });
        };

        const onRemove = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            remove: [okProp],
          });
        };

        const onAtomic = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            atomicOperations: [
              {
                property: okProp,
                type: 'add',
                value: 1,
              },
            ],
          });
        };

        expect(onValue).not.toThrow();
        expect(onRemove).not.toThrow();
        expect(onAtomic).not.toThrow();
      });

      badProps.forEach((badProp) => {
        const onValue = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            values: {
              [badProp]: 'some-update',
            },
          });
        };

        const onRemove = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            remove: [badProp],
          });
        };

        const onAtomic = (): void => {
          updater.getUpdateParams({
            partitionKey: 'some',
            rangeKey: 'sommeee',

            atomicOperations: [
              {
                property: badProp,
                type: 'add',
                value: 1,
              },
            ],
          });
        };

        expect(onValue).toThrow();
        expect(onRemove).toThrow();
        expect(onAtomic).toThrow();
      });
    });
  });
});
