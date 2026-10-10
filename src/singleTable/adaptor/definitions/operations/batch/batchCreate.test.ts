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
    const items = [{ id: 'create-1' }];

    const result = await creator.batchCreate({
      items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(batchMock).toHaveBeenCalledWith({
      table: 'db-table',
      items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });
});
