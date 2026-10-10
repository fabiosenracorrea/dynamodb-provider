/* eslint-disable @typescript-eslint/no-explicit-any */
import { BatchCreator } from './batchCreate';

describe('BatchCreator', () => {
  it('forwards all options to batchMutate and returns creation failures', async () => {
    const creator = new BatchCreator({
      dynamoDB: {
        target: 'v2',
        instance: {} as any,
      },
    });
    const items = [{ id: 'create-1' }];
    const unprocessed = [{ id: 'unprocessed-create' }];
    const batchMutateMock = jest.spyOn(creator, 'batchMutate').mockResolvedValue({
      unprocessed: {
        creations: unprocessed,
        deletes: [{ id: 'ignored-delete' }],
      },
    });

    const result = await creator.batchCreate({
      table: 'table',
      items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(batchMutateMock).toHaveBeenCalledWith({
      table: 'table',
      creations: items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toEqual({
      unprocessed,
    });
  });
});
