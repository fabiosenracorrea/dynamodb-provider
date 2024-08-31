/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableCreator } from './create';

const fakeIso = '2023-12-25T00:00:00.000Z';

describe('single table adaptor - creator', () => {
  beforeAll(() => {
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => fakeIso);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('param creator', () => {
    it('should properly generate the basic db provider param', async () => {
      const creator = new SingleTableCreator({
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

      const params = await creator.getCreateParams({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,
        },
      });
    });

    it('should use type range generator if available', async () => {
      const generator = jest.fn().mockReturnValue('CUSTOM_TS');

      const creator = new SingleTableCreator({
        db: {} as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
            rangeKeyGenerator: generator,
          },
        },
      });

      const params = await creator.getCreateParams({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
      });

      expect(generator).toHaveBeenCalled();
      expect(generator).toHaveBeenCalledWith(
        {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
        'ITEM_TYPE',
      );

      expect(params).toStrictEqual({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: 'CUSTOM_TS',
        },
      });
    });

    it('should properly generate index params', async () => {
      const creator = new SingleTableCreator({
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

      const params = await creator.getCreateParams({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },

        indexes: {
          someIndex: {
            partitionKey: 'index value 1',
            rangeKey: 'index range 1',
          },
          anotherIndex: {
            partitionKey: 'index value 2',
            rangeKey: 'index range 2',
          },
          yetAnotherIndex: {
            partitionKey: 'index value 3',
            rangeKey: 'index range 3',
          },
        },
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,

          _indexHash1: 'index value 1',
          _indexRange1: 'index range 1',
          _indexHash2: 'index value 2',
          _indexRange2: 'index range 2',
          _indexHash3: 'index value 3',
          _indexRange3: 'index range 3',
        },
      });
    });

    it('should properly add expire param', async () => {
      const creator = new SingleTableCreator({
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

      const params = await creator.getCreateParams({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },

        expiresAt: 20392039,

        indexes: {
          someIndex: {
            partitionKey: 'index value 1',
            rangeKey: 'index range 1',
          },
          anotherIndex: {
            partitionKey: 'index value 2',
            rangeKey: 'index range 2',
          },
          yetAnotherIndex: {
            partitionKey: 'index value 3',
            rangeKey: 'index range 3',
          },
        },
      });

      expect(params).toStrictEqual({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,

          _expires: 20392039,

          _indexHash1: 'index value 1',
          _indexRange1: 'index range 1',
          _indexHash2: 'index value 2',
          _indexRange2: 'index range 2',
          _indexHash3: 'index value 3',
          _indexRange3: 'index range 3',
        },
      });
    });
  });

  describe('create action', () => {
    it('should correctly call/return the db provider create fn', async () => {
      const createMock = jest.fn().mockResolvedValue({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
        _ts: fakeIso,
        _pk: 'some',
        _sk: 'other_pk',
      });

      const creator = new SingleTableCreator({
        db: {
          create: createMock,
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

      const created = await creator.create({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
      });

      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,
        },
      });

      expect(created).toStrictEqual({
        prop: 'value',
        name: 'hello',
        age: 27,
      });
    });

    it('should correctly call/return the db provider with type range generator available', async () => {
      const generator = jest.fn().mockReturnValue('CUSTOM_TS');

      const createMock = jest.fn().mockResolvedValue({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
        _ts: fakeIso,
        _pk: 'some',
        _sk: 'other_pk',
      });

      const creator = new SingleTableCreator({
        db: {
          create: createMock,
        } as any,

        config: {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
            rangeKeyGenerator: generator,
          },
        },
      });

      const created = await creator.create({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
      });

      expect(generator).toHaveBeenCalled();
      expect(generator).toHaveBeenCalledWith(
        {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
        'ITEM_TYPE',
      );

      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: 'CUSTOM_TS',
        },
      });

      expect(created).toStrictEqual({
        prop: 'value',
        name: 'hello',
        age: 27,
      });
    });

    it('should correctly call/return provider when indexes available', async () => {
      const createMock = jest.fn().mockResolvedValue({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
        _ts: fakeIso,
        _pk: 'some',
        _sk: 'other_pk',
        _indexHash1: 'index value 1',
        _indexRange1: 'index range 1',
        _indexHash2: 'index value 2',
        _indexRange2: 'index range 2',
        _indexHash3: 'index value 3',
        _indexRange3: 'index range 3',
      });

      const creator = new SingleTableCreator({
        db: {
          create: createMock,
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

      const created = await creator.create({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },

        indexes: {
          someIndex: {
            partitionKey: 'index value 1',
            rangeKey: 'index range 1',
          },
          anotherIndex: {
            partitionKey: 'index value 2',
            rangeKey: 'index range 2',
          },
          yetAnotherIndex: {
            partitionKey: 'index value 3',
            rangeKey: 'index range 3',
          },
        },
      });

      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,
          _indexHash1: 'index value 1',
          _indexRange1: 'index range 1',
          _indexHash2: 'index value 2',
          _indexRange2: 'index range 2',
          _indexHash3: 'index value 3',
          _indexRange3: 'index range 3',
        },
      });

      expect(created).toStrictEqual({
        prop: 'value',
        name: 'hello',
        age: 27,
      });
    });

    it('should correctly call/return provider expiresAt available', async () => {
      const createMock = jest.fn().mockResolvedValue({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
        _ts: fakeIso,
        _pk: 'some',
        _sk: 'other_pk',
        _indexHash1: 'index value 1',
        _indexRange1: 'index range 1',
        _indexHash2: 'index value 2',
        _indexRange2: 'index range 2',
        _indexHash3: 'index value 3',
        _indexRange3: 'index range 3',
      });

      const creator = new SingleTableCreator({
        db: {
          create: createMock,
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

      const created = await creator.create({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },

        expiresAt: 23802309,

        indexes: {
          someIndex: {
            partitionKey: 'index value 1',
            rangeKey: 'index range 1',
          },
          anotherIndex: {
            partitionKey: 'index value 2',
            rangeKey: 'index range 2',
          },
          yetAnotherIndex: {
            partitionKey: 'index value 3',
            rangeKey: 'index range 3',
          },
        },
      });

      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,
          _expires: 23802309,
          _indexHash1: 'index value 1',
          _indexRange1: 'index range 1',
          _indexHash2: 'index value 2',
          _indexRange2: 'index range 2',
          _indexHash3: 'index value 3',
          _indexRange3: 'index range 3',
        },
      });

      expect(created).toStrictEqual({
        prop: 'value',
        name: 'hello',
        age: 27,
      });
    });

    it('should keep type prop is configured to', async () => {
      const createMock = jest.fn().mockResolvedValue({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
        _ts: fakeIso,
        _pk: 'some',
        _sk: 'other_pk',
      });

      const creator = new SingleTableCreator({
        db: {
          create: createMock,
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

      const created = await creator.create({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
      });

      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,
        },
      });

      expect(created).toStrictEqual({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
      });
    });

    it('should keep use prop cleanup fn if configured to', async () => {
      const createMock = jest.fn().mockResolvedValue({
        prop: 'value',
        name: 'hello',
        age: 27,
        _type: 'ITEM_TYPE',
        _ts: fakeIso,
        _pk: 'some',
        _sk: 'other_pk',
      });

      const creator = new SingleTableCreator({
        db: {
          create: createMock,
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
          propertyCleanup: ({ _pk, _type, ...item }) => item,
        },
      });

      const created = await creator.create({
        key: {
          partitionKey: 'some',
          rangeKey: 'other_pk',
        },

        type: 'ITEM_TYPE',

        item: {
          prop: 'value',
          name: 'hello',
          age: 27,
        },
      });

      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith({
        table: 'db-table',

        item: {
          _pk: 'some',
          _sk: 'other_pk',
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: fakeIso,
        },
      });

      expect(created).toStrictEqual({
        _sk: 'other_pk',
        prop: 'value',
        name: 'hello',
        age: 27,
        _ts: fakeIso,
      });
    });
  });
});
