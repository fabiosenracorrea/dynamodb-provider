/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableBatchGetter } from './batchGet';

describe('single table adaptor - batch get', () => {
  it('should property call the database provider batchGet', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],
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

  it('should forward the consistentRead property', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],

      consistentRead: true,
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],

      consistentRead: true,
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

  it('should forward the throwOnUnprocessed property', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],

      consistentRead: true,
      throwOnUnprocessed: true,
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],

      consistentRead: true,
      throwOnUnprocessed: true,
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

  it('should forward the propertiesToRetrieve property', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],

      consistentRead: true,
      throwOnUnprocessed: true,
      propertiesToRetrieve: ['id', 'name', 'some-other'],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],

      consistentRead: true,
      propertiesToRetrieve: ['id', 'name', 'some-other'],
      throwOnUnprocessed: true,
    });
  });

  it('should remove internal properties by default', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],
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

  it('should keep type property if configured', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],
    });
    expect(items).toStrictEqual([
      {
        id: '1',
        name: 'some',
        other: 'prop',
        _type: 'SOME_TYPE',
      },
      {
        id: '2',
        name: 'some1',
        other: 'prop--',
        _type: 'SOME_TYPE',
      },
    ]);
  });

  it('should keep props based on remover if configured', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],
    });
    expect(items).toStrictEqual([
      {
        id: '1',
        name: 'some',
        other: 'prop',
        _pk: 'some',
        _ts: '123',
      },
      {
        id: '2',
        name: 'some1',
        other: 'prop--',
        _pk: 'some',
        _ts: '1233',
      },
    ]);
  });

  it('should apply _parser_ if present', async () => {
    const batchMock = jest.fn().mockResolvedValue([
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
    ]);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
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

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],
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
