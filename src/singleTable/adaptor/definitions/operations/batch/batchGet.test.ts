/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableBatchGetter } from './batchGet';

const batchResult = [
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
];

const cleanupResult = [
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
];

const tableConfig = {
  table: 'db-table',
  partitionKey: '_pk',
  rangeKey: '_sk',
  typeIndex: {
    name: 'TypeIndexName',
    partitionKey: '_type',
    rangeKey: '_ts',
  },
};

function toGetter() {
  const batchMock = jest.fn().mockResolvedValue(batchResult);

  const getter = new SingleTableBatchGetter({
    db: {
      batchGet: batchMock,
    } as any,

    config: tableConfig,
  });

  return {
    getter,
    batchMock,
  };
}

describe('single table adaptor - batch get', () => {
  it('should call the database provider batchGet', async () => {
    const { batchMock, getter } = toGetter();

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
    expect(items).toStrictEqual(cleanupResult);
  });

  it('should forward the _consistentRead_ property', async () => {
    const { batchMock, getter } = toGetter();

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
    expect(items).toStrictEqual(cleanupResult);
  });

  it('should forward the _throwOnUnprocessed_ property', async () => {
    const { batchMock, getter } = toGetter();

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
    expect(items).toStrictEqual(cleanupResult);
  });

  it('should forward the _propertiesToRetrieve_ property', async () => {
    const { batchMock, getter } = toGetter();

    type Entity = {
      id: string;
      name: string;
      other: string;
    };

    await getter.batchGet<Entity>({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],

      consistentRead: true,
      throwOnUnprocessed: true,
      propertiesToRetrieve: ['id', 'name', 'other'],
    });

    expect(batchMock).toHaveBeenCalled();
    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',

      keys: [
        { _pk: 'some', _sk: 'other' },
        { _pk: 'some', _sk: 'other2' },
      ],

      consistentRead: true,
      propertiesToRetrieve: ['id', 'name', 'other'],
      throwOnUnprocessed: true,
    });
  });

  it('[TYPES] _propertiesToRetrieve_ only allows typed props', async () => {
    const { getter } = toGetter();

    type Entity = {
      id: string;
      name: string;
      other: string;
    };

    getter.batchGet<Entity>({
      keys: [],

      propertiesToRetrieve: ['id', 'name', 'other'],
    });

    getter.batchGet<Entity>({
      keys: [],

      // @ts-expect-error no invalid props
      propertiesToRetrieve: ['id', 'name', 'bad'],
    });
  });

  it('should remove internal properties by default', async () => {
    const { getter } = toGetter();

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
      ],
    });

    expect(items).toStrictEqual(cleanupResult);
  });

  it('should keep type property if configured', async () => {
    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: jest.fn().mockResolvedValue(batchResult),
      } as any,

      config: {
        ...tableConfig,
        keepTypeProperty: true,
      },
    });

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
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
    const batchMock = jest.fn().mockResolvedValue(batchResult);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
      } as any,

      config: {
        ...tableConfig,
        propertyCleanup: ({ _sk, _type, ...item }) => item,
      },
    });

    const items = await getter.batchGet({
      keys: [
        { partitionKey: 'some', rangeKey: 'other' },
        { partitionKey: 'some', rangeKey: 'other2' },
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
    const batchMock = jest.fn().mockResolvedValue(batchResult);

    const getter = new SingleTableBatchGetter({
      db: {
        batchGet: batchMock,
      } as any,

      config: tableConfig,

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
