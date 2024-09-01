/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableTransactionWriter } from './transactionWrite';

describe('single table adaptor - transact writer', () => {
  it('should properly call the db provider transact write', async () => {
    const transactMock = jest.fn().mockResolvedValue({
      items: [],
    });

    const creatorMock = {
      getCreateParams: jest.fn().mockReturnValue({
        create: true,
        mock: 'create params',
      }),
    };

    const updaterMock = {
      getUpdateParams: jest.fn().mockReturnValue({
        update: true,
        mock: 'update params',
      }),
    };

    const removerMock = {
      getDeleteParams: jest.fn().mockReturnValue({
        remove: true,
        mock: 'delete params',
      }),
    };

    const transact = new SingleTableTransactionWriter({
      db: {
        executeTransaction: transactMock,
      } as any,

      creator: creatorMock as any,
      updater: updaterMock as any,
      remover: removerMock as any,

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

    await transact.executeTransaction([
      {
        create: {} as any,
      },
      {
        update: {} as any,
      },
      {
        erase: {} as any,
      },
      null,
    ]);

    // As we are just translating the syntax to our db provider,
    // we simply validate the correct helpers are called
    expect(transactMock).toHaveBeenCalled();
    expect(transactMock).toHaveBeenCalledWith([
      {
        create: {
          create: true,
          mock: 'create params',
        },
      },
      {
        update: {
          update: true,
          mock: 'update params',
        },
      },
      {
        erase: {
          remove: true,
          mock: 'delete params',
        },
      },
    ]);
  });

  it('should build the validation params correctly', async () => {
    const transactMock = jest.fn().mockResolvedValue({
      items: [],
    });

    const transact = new SingleTableTransactionWriter({
      db: {
        executeTransaction: transactMock,
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

    const conditions = [
      {
        operation: 'equal' as const,
        value: 20,
        property: 'some',
      },
      {
        operation: 'in' as const,
        values: [1, 2, 3],
        property: 'list',
      },
    ];
    await transact.executeTransaction([
      {
        validate: {
          partitionKey: 'some',
          rangeKey: 'range',
          conditions,
        },
      },
    ]);

    expect(transactMock).toHaveBeenCalled();
    expect(transactMock).toHaveBeenCalledWith([
      {
        validate: {
          table: 'db-table',

          key: {
            _pk: 'some',
            _sk: 'range',
          },

          conditions,
        },
      },
    ]);
  });
});
