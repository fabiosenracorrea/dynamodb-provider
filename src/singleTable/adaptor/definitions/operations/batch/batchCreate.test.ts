/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableBatchCreator } from './batchCreate';

const tableConfig = {
  table: 'db-table',
  partitionKey: '_pk',
  rangeKey: '_sk',
};

describe('single table adaptor - batch create', () => {
  it('should inject the table and forward all options to batchCreate', async () => {
    const batchResult = {
      unprocessed: [{ id: 'unprocessed-create' }],
    };
    const batchMock = jest.fn().mockResolvedValue(batchResult);
    const creator = new SingleTableBatchCreator({
      db: {
        batchCreate: batchMock,
      } as any,
      config: tableConfig,
    });
    const creation = { id: 'create-1' };
    const items = [
      {
        item: creation,
        key: {
          partitionKey: ['USER', '1'],
          rangeKey: ['PROFILE', '1'],
        },
      },
    ];

    const result = await creator.batchCreate({
      items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',
      items: [
        {
          ...creation,
          _pk: 'USER#1',
          _sk: 'PROFILE#1',
        },
      ],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });
});
