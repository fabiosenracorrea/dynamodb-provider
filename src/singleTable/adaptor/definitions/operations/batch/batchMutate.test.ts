/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableBatchMutator } from './batchMutate';

const tableConfig = {
  table: 'db-table',
  partitionKey: '_pk',
  rangeKey: '_sk',
};

describe('single table adaptor - batch mutate', () => {
  it('should convert delete references and forward all options to batchMutate', async () => {
    const batchResult = {
      unprocessed: {
        creations: [{ id: 'unprocessed-create' }],
        deletes: [{ _pk: 'USER#1', _sk: 'PROFILE#1' }],
      },
    };
    const batchMock = jest.fn().mockResolvedValue(batchResult);
    const mutator = new SingleTableBatchMutator({
      db: {
        batchMutate: batchMock,
      } as any,
      config: tableConfig,
    });
    const creations = [{ id: 'create-1' }];

    const result = await mutator.batchMutate({
      creations,
      deletes: [
        {
          partitionKey: ['USER', '1'],
          rangeKey: ['PROFILE', '1'],
        },
      ],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',
      creations,
      deletes: [{ _pk: 'USER#1', _sk: 'PROFILE#1' }],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });
});
