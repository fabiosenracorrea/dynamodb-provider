/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableQueryBuilder } from './query';

describe('single table adaptor - query', () => {
  it('should properly build db provider query params/call', async () => {
    const queryMock = jest.fn().mockResolvedValue({
      items: [
        {
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: 'something',
          _pk: 'some',
          _sk: 'other_pk',
        },
      ],
    });

    const queryBuilder = new SingleTableQueryBuilder({
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

    const result = await queryBuilder.query({
      partition: ['hello', 'friend'],
    });

    expect(queryMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith({
      table: 'db-table',

      partitionKey: {
        name: '_pk',
        value: 'hello#friend',
      },
    });

    expect(result.items).toStrictEqual([
      {
        prop: 'value',
        name: 'hello',
        age: 27,
      },
    ]);
  });

  it('should handle range value operations', async () => {
    const queryMock = jest.fn().mockResolvedValue({
      items: [],
    });

    const queryBuilder = new SingleTableQueryBuilder({
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

    await queryBuilder.query({
      partition: ['hello', 'friend'],

      range: {
        operation: 'bigger_than',
        value: 'f',
      },
    });

    expect(queryMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith({
      table: 'db-table',

      partitionKey: {
        name: '_pk',
        value: 'hello#friend',
      },

      rangeKey: {
        operation: 'bigger_than',
        value: 'f',
        name: '_sk',
      },
    });
  });

  it('should handle range between operations', async () => {
    const queryMock = jest.fn().mockResolvedValue({
      items: [],
    });

    const queryBuilder = new SingleTableQueryBuilder({
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

    await queryBuilder.query({
      partition: ['hello', 'friend'],

      range: {
        operation: 'between',
        low: '2022',
        high: '2023',
      },
    });

    expect(queryMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith({
      table: 'db-table',

      partitionKey: {
        name: '_pk',
        value: 'hello#friend',
      },

      rangeKey: {
        operation: 'between',
        low: '2022',
        high: '2023',
        name: '_sk',
      },
    });
  });

  it('should handle index references', async () => {
    const queryMock = jest.fn().mockResolvedValue({
      items: [],
    });

    const queryBuilder = new SingleTableQueryBuilder({
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
        indexes: {
          SomeIndex: {
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

    await queryBuilder.query({
      partition: ['hello', 'friend'],

      range: {
        operation: 'between',
        low: '2022',
        high: '2023',
      },

      index: 'SomeIndex',
    });

    expect(queryMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith({
      table: 'db-table',

      index: 'SomeIndex',

      partitionKey: {
        name: '_indexHash1',
        value: 'hello#friend',
      },

      rangeKey: {
        operation: 'between',
        low: '2022',
        high: '2023',
        name: '_indexRange1',
      },
    });
  });

  it('should forward all other options', async () => {
    const queryMock = jest.fn().mockResolvedValue({
      items: [],
    });

    const queryBuilder = new SingleTableQueryBuilder({
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
        indexes: {
          SomeIndex: {
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

    const forwardProps = {
      filters: { someFilter: true },
      fullRetrieval: false,
      limit: 10,
      paginationToken: 'hello',
      retrieveOrder: 'DESC',
    };

    await queryBuilder.query({
      partition: ['hello', 'friend'],

      range: {
        operation: 'between',
        low: '2022',
        high: '2023',
      },

      index: 'SomeIndex',

      ...(forwardProps as any),
    });

    expect(queryMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith({
      table: 'db-table',

      index: 'SomeIndex',

      partitionKey: {
        name: '_indexHash1',
        value: 'hello#friend',
      },

      rangeKey: {
        operation: 'between',
        low: '2022',
        high: '2023',
        name: '_indexRange1',
      },

      ...forwardProps,
    });
  });

  it('should return paginationToken if applicable', async () => {
    const token = 'TEST_TOKEN';

    const queryMock = jest.fn().mockResolvedValue({
      items: [
        {
          prop: 'value',
          name: 'hello',
          age: 27,
          _type: 'ITEM_TYPE',
          _ts: 'something',
          _pk: 'some',
          _sk: 'other_pk',
        },
      ],

      paginationToken: token,
    });

    const queryBuilder = new SingleTableQueryBuilder({
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

    const result = await queryBuilder.query({
      partition: ['hello', 'friend'],
    });

    expect(queryMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith({
      table: 'db-table',

      partitionKey: {
        name: '_pk',
        value: 'hello#friend',
      },
    });

    expect(result.paginationToken).toEqual(token);
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

    const queryBuilder = new SingleTableQueryBuilder({
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
        indexes: {
          SomeIndex: {
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

      parser: (data) => ({
        ...data,
        extraProp: 'yes!',
      }),
    });

    const { items } = await queryBuilder.query({
      partition: ['hello', 'friend'],

      range: {
        operation: 'between',
        low: '2022',
        high: '2023',
      },

      index: 'SomeIndex',
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
