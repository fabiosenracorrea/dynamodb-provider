/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { waitExponentially } from 'utils/backOff';

import { fakeDBCommands } from '../dynamoDB/commands.fake';
import { BatchMutator } from './batchMutate';

jest.mock('utils/backOff', () => ({
  waitExponentially: jest.fn().mockResolvedValue(undefined),
}));

type Entity = {
  id: string;
  value?: number;
};

const table = 'table';

function createV2Mutator(...responses: any[]) {
  const promiseMock = jest.fn().mockResolvedValue({});

  responses.forEach((response) => promiseMock.mockResolvedValueOnce(response));

  const batchWriteMock = jest.fn().mockReturnValue({
    promise: promiseMock,
  });

  const mutator = new BatchMutator({
    dynamoDB: {
      target: 'v2',
      instance: {
        batchWrite: batchWriteMock,
      } as any,
    },
  });

  return { batchWriteMock, mutator };
}

describe('BatchMutator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not call DynamoDB when there are no mutations', async () => {
    const { batchWriteMock, mutator } = createV2Mutator();

    const result = await mutator.batchMutate<Entity>({
      table,
    });

    expect(batchWriteMock).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('maps creations, deletions, and mixed mutations to batch write requests', async () => {
    const { batchWriteMock, mutator } = createV2Mutator();
    const creation = { id: 'create-1', value: 1 };
    const deletion = { id: 'delete-1' };

    await mutator.batchMutate<Entity>({ table, creations: [creation] });
    await mutator.batchMutate<Entity, 'id'>({ table, deletes: [deletion] });
    await mutator.batchMutate<Entity, 'id'>({
      table,
      creations: [creation],
      deletes: [deletion],
    });

    expect(batchWriteMock).toHaveBeenNthCalledWith(1, {
      RequestItems: {
        [table]: [{ PutRequest: { Item: creation } }],
      },
    });
    expect(batchWriteMock).toHaveBeenNthCalledWith(2, {
      RequestItems: {
        [table]: [{ DeleteRequest: { Key: deletion } }],
      },
    });
    expect(batchWriteMock).toHaveBeenNthCalledWith(3, {
      RequestItems: {
        [table]: [
          { DeleteRequest: { Key: deletion } },
          { PutRequest: { Item: creation } },
        ],
      },
    });
  });

  it('splits operations into batches of 25 and aggregates unprocessed mutations', async () => {
    const creations = Array.from({ length: 13 }, (_, index) => ({
      id: `create-${index}`,
    }));
    const deletions = Array.from({ length: 13 }, (_, index) => ({
      id: `delete-${index}`,
    }));
    const { batchWriteMock, mutator } = createV2Mutator(
      {
        UnprocessedItems: {
          [table]: [
            { PutRequest: { Item: creations[0] } },
            { DeleteRequest: { Key: deletions[0] } },
          ],
        },
      },
      {
        UnprocessedItems: {
          [table]: [{ DeleteRequest: { Key: deletions[12] } }],
        },
      },
    );

    const result = await mutator.batchMutate<Entity, 'id'>({
      table,
      creations,
      deletes: deletions,
      maxRetries: 1,
    });

    expect(batchWriteMock).toHaveBeenCalledTimes(2);
    expect(
      batchWriteMock.mock.calls.map(([params]) => params.RequestItems[table].length),
    ).toEqual([25, 1]);
    expect(result).toEqual({
      unprocessed: {
        creations: [creations[0]],
        deletes: [deletions[0], deletions[12]],
      },
    });
  });

  it('retries only unprocessed mutations and returns an empty result after success', async () => {
    const creation = { id: 'create-1' };
    const deletion = { id: 'delete-1' };
    const { batchWriteMock, mutator } = createV2Mutator(
      {
        UnprocessedItems: {
          [table]: [
            { PutRequest: { Item: creation } },
            { DeleteRequest: { Key: deletion } },
          ],
        },
      },
      {},
    );

    const result = await mutator.batchMutate<Entity, 'id'>({
      table,
      creations: [creation, { id: 'processed-create' }],
      deletes: [deletion, { id: 'processed-delete' }],
      maxRetries: 2,
    });

    expect(batchWriteMock).toHaveBeenCalledTimes(2);
    expect(batchWriteMock).toHaveBeenNthCalledWith(2, {
      RequestItems: {
        [table]: [
          { DeleteRequest: { Key: deletion } },
          { PutRequest: { Item: creation } },
        ],
      },
    });
    expect(waitExponentially).toHaveBeenCalledWith(1);
    expect(result).toEqual({});
  });

  it('returns remaining creations and deletions after reaching max retries', async () => {
    const creation = { id: 'create-1' };
    const deletion = { id: 'delete-1' };
    const { mutator } = createV2Mutator({
      UnprocessedItems: {
        [table]: [
          { PutRequest: { Item: creation } },
          { DeleteRequest: { Key: deletion } },
        ],
      },
    });

    const result = await mutator.batchMutate<Entity, 'id'>({
      table,
      creations: [creation],
      deletes: [deletion],
      maxRetries: 1,
    });

    expect(result).toEqual({
      unprocessed: {
        creations: [creation],
        deletes: [deletion],
      },
    });
  });

  it('throws when mutations remain and throwOnUnprocessed is enabled', async () => {
    const creation = { id: 'create-1' };
    const { batchWriteMock, mutator } = createV2Mutator({
      UnprocessedItems: {
        [table]: [{ PutRequest: { Item: creation } }],
      },
    });

    await expect(
      mutator.batchMutate<Entity>({
        table,
        creations: [creation],
        maxRetries: 1,
        throwOnUnprocessed: true,
      }),
    ).rejects.toThrow('Unprocessed mutations after max retries');

    expect(batchWriteMock).toHaveBeenCalledTimes(1);
  });

  it('uses BatchWriteCommand with a v3 client', async () => {
    const sendMock = jest.fn().mockResolvedValue({});
    const creation = { id: 'create-1' };
    const mutator = new BatchMutator({
      dynamoDB: {
        target: 'v3',
        commands: fakeDBCommands,
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const result = await mutator.batchMutate<Entity>({
      table,
      creations: [creation],
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          RequestItems: {
            [table]: [{ PutRequest: { Item: creation } }],
          },
        },
      }),
    );
    expect(result).toEqual({});
  });
});
