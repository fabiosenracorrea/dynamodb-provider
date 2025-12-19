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

    it('should handle type updates if typeIndex is configured', () => {
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

        type: 'NEW_ENTITY_TYPE',
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
          _type: 'NEW_ENTITY_TYPE',
        },
      });
    });

    it('should handle type along with other table config params', () => {
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

        type: 'UPDATED_TYPE',
        expiresAt: 2302930,
        indexes: {
          someIndex: {
            partitionKey: 'index value 1',
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
          _type: 'UPDATED_TYPE',
          _expires: 2302930,
          _indexHash1: 'index value 1',
        },
      });
    });

    it('should not add type to values if type is not provided', () => {
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

    it('should allow atomic operations on numeric index range keys via atomicIndexes', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            LeaderboardIndex: {
              partitionKey: '_lbPK',
              rangeKey: '_score',
              numeric: true,
            },
          },
        },
      });

      const params = updater.getUpdateParams({
        partitionKey: 'PLAYER#123',
        rangeKey: '#DATA',

        // @ts-expect-error SingleTableUpdater is not generic for config
        atomicIndexes: [
          {
            index: 'LeaderboardIndex',
            type: 'add',
            value: 50,
          },
        ],
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'PLAYER#123',
          _sk: '#DATA',
        },

        atomicOperations: [
          {
            type: 'add',
            value: 50,
            property: '_score',
          },
        ],
      });
    });

    it('should merge atomicIndexes with regular atomicOperations', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            ScoreIndex: {
              partitionKey: '_scorePK',
              rangeKey: '_score',
              numeric: true,
            },
            RankIndex: {
              partitionKey: '_rankPK',
              rangeKey: '_rank',
              numeric: true,
            },
          },
        },
      });

      const params = updater.getUpdateParams({
        partitionKey: 'USER#456',
        rangeKey: '#PROFILE',

        values: {
          name: 'John',
        },

        atomicOperations: [
          {
            type: 'add',
            property: 'loginCount',
            value: 1,
          },
        ],

        // @ts-expect-error SingleTableUpdater is not generic for config
        atomicIndexes: [
          {
            index: 'ScoreIndex',
            type: 'add',
            value: 100,
          },
          {
            index: 'RankIndex',
            type: 'subtract',
            value: 1,
          },
        ],
      });

      expect(params.atomicOperations).toHaveLength(3);
      expect(params.atomicOperations).toContainEqual({
        type: 'add',
        property: 'loginCount',
        value: 1,
      });
      expect(params.atomicOperations).toContainEqual({
        type: 'add',
        value: 100,
        property: '_score',
      });
      expect(params.atomicOperations).toContainEqual({
        type: 'subtract',
        value: 1,
        property: '_rank',
      });
    });

    it('should throw error for atomic index on non-numeric index', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            RegularIndex: {
              partitionKey: '_regPK',
              rangeKey: '_regSK',
              numeric: false,
            },
          },
        },
      });

      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#1',
          rangeKey: '#DATA',

          // @ts-expect-error SingleTableUpdater is not generic for config
          atomicIndexes: [
            {
              index: 'RegularIndex',
              type: 'add',
              value: 5,
            },
          ],
        });
      };

      expect(attempt).toThrow('Invalid atomic index reference detected');
    });

    it('should throw error for atomic index on undefined numeric flag', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            DefaultIndex: {
              partitionKey: '_defPK',
              rangeKey: '_defSK',
            },
          },
        },
      });

      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#2',
          rangeKey: '#DATA',

          // @ts-expect-error SingleTableUpdater is not generic for config
          atomicIndexes: [
            {
              index: 'DefaultIndex',
              type: 'sum',
              value: 10,
            },
          ],
        });
      };

      expect(attempt).toThrow('Invalid atomic index reference detected');
    });

    it('should throw error for atomic index on non-existent index', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            ExistingIndex: {
              partitionKey: '_exPK',
              rangeKey: '_exSK',
              numeric: true,
            },
          },
        },
      });

      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#3',
          rangeKey: '#DATA',

          // @ts-expect-error SingleTableUpdater is not generic for config
          atomicIndexes: [
            {
              index: 'NonExistentIndex',
              type: 'add',
              value: 7,
            },
          ],
        });
      };

      expect(attempt).toThrow('Invalid atomic index reference detected');
    });

    it('should not throw for atomicIndexes when blockInternalPropUpdate is true', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          blockInternalPropUpdate: true,
          indexes: {
            NumericIndex: {
              partitionKey: '_numPK',
              rangeKey: '_numSK',
              numeric: true,
            },
          },
        },
      });

      // This should NOT throw even though blockInternalPropUpdate is true
      // because atomicIndexes are validated separately and converted to atomic operations
      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#4',
          rangeKey: '#DATA',

          // @ts-expect-error SingleTableUpdater is not generic for config
          atomicIndexes: [
            {
              index: 'NumericIndex',
              type: 'add',
              value: 15,
            },
          ],
        });
      };

      expect(attempt).not.toThrow();
    });

    it('should handle atomicIndexes with conditional operations', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            CounterIndex: {
              partitionKey: '_counterPK',
              rangeKey: '_count',
              numeric: true,
            },
          },
        },
      });

      const params = updater.getUpdateParams({
        partitionKey: 'COUNTER#1',
        rangeKey: '#DATA',

        // @ts-expect-error SingleTableUpdater is not generic for config
        atomicIndexes: [
          {
            index: 'CounterIndex',
            type: 'subtract',
            value: 1,
            if: {
              operation: 'bigger_than',
              value: 0,
            },
          },
        ],
      });

      expect(params.atomicOperations).toHaveLength(1);
      expect(params.atomicOperations![0]).toMatchObject({
        type: 'subtract',
        value: 1,
        property: '_count',
        if: {
          operation: 'bigger_than',
          value: 0,
        },
      });
    });

    it('should handle multiple atomicIndexes on different indexes', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            Index1: {
              partitionKey: '_i1pk',
              rangeKey: '_i1rk',
              numeric: true,
            },
            Index2: {
              partitionKey: '_i2pk',
              rangeKey: '_i2rk',
              numeric: true,
            },
            Index3: {
              partitionKey: '_i3pk',
              rangeKey: '_i3rk',
              numeric: true,
            },
          },
        },
      });

      const params = updater.getUpdateParams({
        partitionKey: 'MULTI#1',
        rangeKey: '#DATA',

        // @ts-expect-error SingleTableUpdater is not generic for config
        atomicIndexes: [
          { index: 'Index1', type: 'add', value: 10 },
          { index: 'Index2', type: 'sum', value: 20 },
          { index: 'Index3', type: 'subtract', value: 5 },
        ],
      });

      expect(params.atomicOperations).toHaveLength(3);
      expect(params.atomicOperations![0].property).toBe('_i1rk');
      expect(params.atomicOperations![1].property).toBe('_i2rk');
      expect(params.atomicOperations![2].property).toBe('_i3rk');
    });

    it('should validate all atomicIndexes and fail if any is invalid', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            ValidIndex: {
              partitionKey: '_vpk',
              rangeKey: '_vrk',
              numeric: true,
            },
            InvalidIndex: {
              partitionKey: '_ipk',
              rangeKey: '_irk',
              numeric: false,
            },
          },
        },
      });

      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#5',
          rangeKey: '#DATA',

          // @ts-expect-error SingleTableUpdater is not generic for config
          atomicIndexes: [
            { index: 'ValidIndex', type: 'add', value: 1 },
            { index: 'InvalidIndex', type: 'add', value: 2 },
          ],
        });
      };

      expect(attempt).toThrow('Invalid atomic index reference detected');
    });

    it('should not throw when atomicIndexes is empty array', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            SomeIndex: {
              partitionKey: '_spk',
              rangeKey: '_srk',
              numeric: true,
            },
          },
        },
      });

      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#6',
          rangeKey: '#DATA',
          values: { name: 'test' },
          // @ts-expect-error SingleTableUpdater is not generic for config
          atomicIndexes: [],
        });
      };

      expect(attempt).not.toThrow();
    });

    it('should not throw when atomicIndexes is undefined', () => {
      const updater = new SingleTableUpdater({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          indexes: {
            SomeIndex: {
              partitionKey: '_spk',
              rangeKey: '_srk',
              numeric: true,
            },
          },
        },
      });

      const attempt = () => {
        updater.getUpdateParams({
          partitionKey: 'ITEM#7',
          rangeKey: '#DATA',
          values: { name: 'test' },
        });
      };

      expect(attempt).not.toThrow();
    });

    it('should combine atomicIndexes with other table config params', () => {
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
            ScoreIndex: {
              partitionKey: '_scorePK',
              rangeKey: '_score',
              numeric: true,
            },
            CategoryIndex: {
              partitionKey: '_catPK',
              rangeKey: '_catSK',
            },
          },
        },
      });

      const params = updater.getUpdateParams({
        partitionKey: 'GAME#1',
        rangeKey: '#PLAYER#123',

        values: {
          playerName: 'Alice',
        },

        type: 'GAME_RECORD',
        expiresAt: 1234567890,

        indexes: {
          CategoryIndex: {
            partitionKey: 'CATEGORY#ACTION',
          },
        },

        // @ts-expect-error SingleTableUpdater is not generic for config
        atomicIndexes: [
          {
            index: 'ScoreIndex',
            type: 'add',
            value: 500,
          },
        ],

        atomicOperations: [
          {
            type: 'add',
            property: 'playCount',
            value: 1,
          },
        ],
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        key: {
          _pk: 'GAME#1',
          _sk: '#PLAYER#123',
        },

        values: {
          playerName: 'Alice',
          _type: 'GAME_RECORD',
          _expires: 1234567890,
          _catPK: 'CATEGORY#ACTION',
        },

        atomicOperations: [
          {
            type: 'add',
            property: 'playCount',
            value: 1,
          },
          {
            type: 'add',
            value: 500,
            property: '_score',
          },
        ],
      });
    });
  });
});
