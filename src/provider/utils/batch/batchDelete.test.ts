/* eslint-disable @typescript-eslint/no-explicit-any */
import { BatchDeleter } from './batchDelete';

describe('BatchDeleter', () => {
  it('forwards all options to batchMutate and returns deletion failures', async () => {
    const deleter = new BatchDeleter({
      dynamoDB: {
        target: 'v2',
        instance: {} as any,
      },
    });
    const items = [{ id: 'delete-1' }];
    const unprocessed = [{ id: 'unprocessed-delete' }];
    const batchMutateMock = jest.spyOn(deleter, 'batchMutate').mockResolvedValue({
      unprocessed: {
        creations: [{ id: 'ignored-create' }],
        deletes: unprocessed,
      },
    });

    const result = await deleter.batchDelete({
      table: 'table',
      items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(batchMutateMock).toHaveBeenCalledWith({
      table: 'table',
      deletes: items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toEqual({
      unprocessed,
    });
  });
});
