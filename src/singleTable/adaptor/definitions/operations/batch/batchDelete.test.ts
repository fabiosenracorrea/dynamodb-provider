/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableBatchDeleter } from './batchDelete';

const tableConfig = {
  table: 'db-table',
  partitionKey: '_pk',
  rangeKey: '_sk',
};

describe('single table adaptor - batch delete', () => {
  it('should convert key references and forward all options to batchDelete', async () => {
    const batchResult = {
      unprocessed: [{ _pk: 'USER#1', _sk: 'PROFILE#1' }],
    };
    const batchMock = jest.fn().mockResolvedValue(batchResult);
    const deleter = new SingleTableBatchDeleter({
      db: {
        batchDelete: batchMock,
      } as any,
      config: tableConfig,
    });

    const result = await deleter.batchDelete({
      items: [
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
      items: [{ _pk: 'USER#1', _sk: 'PROFILE#1' }],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });
});
