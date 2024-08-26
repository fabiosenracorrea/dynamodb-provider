/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BatchGetter } from './batchGet';

describe('batchGetter', () => {
  it('should properly call the dynamodb BatchGet operation', async () => {
    const batchGetMock = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Responses: {
          table: [
            {
              id: '23023',
              hello: 'lalal',
              createdAt: '2024',
            },
            {
              id: '12312',
              hello: 'sdasda',
              createdAt: '2022',
            },
            {
              id: '43523452',
              hello: 'dsfsdfd',
              createdAt: '2021',
            },
          ],
        },
      }),
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        batchGet: batchGetMock,
      } as any,
    });

    const result = await batchGetter.batchGet({
      table: 'table',
      keys: [
        {
          id: '23023',
          hello: 'lalal',
        },
        {
          id: '12312',
          hello: 'sdasda',
        },
        {
          id: '43523452',
          hello: 'dsfsdfd',
        },
      ],
    });

    expect(batchGetMock).toHaveBeenCalledTimes(1);
    expect(batchGetMock).toHaveBeenCalledWith({
      RequestItems: {
        table: {
          Keys: [
            {
              id: '23023',
              hello: 'lalal',
            },
            {
              id: '12312',
              hello: 'sdasda',
            },
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    expect(result).toEqual([
      {
        id: '23023',
        hello: 'lalal',
        createdAt: '2024',
      },
      {
        id: '12312',
        hello: 'sdasda',
        createdAt: '2022',
      },
      {
        id: '43523452',
        hello: 'dsfsdfd',
        createdAt: '2021',
      },
    ]);
  });

  it('should handle more than 100 keys', async () => {
    const items = Array.from({ length: 310 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      someProp: Math.random(),
    }));

    const promiseMock = jest.fn();

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(0, 100),
      },
    });

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(100, 200),
      },
    });

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(200, 300),
      },
    });

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(300),
      },
    });

    const batchGetMock = jest.fn().mockReturnValue({
      promise: promiseMock,
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        batchGet: batchGetMock,
      } as any,
    });

    const result = await batchGetter.batchGet({
      table: 'table',
      keys: items.map(({ id }) => ({
        id,
      })),
    });

    expect(batchGetMock).toHaveBeenCalledTimes(4);

    expect(result).toEqual(items);
  });

  it('should handle UnprocessedKeys', async () => {
    const promiseMock = jest.fn();

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: [
          {
            id: '23023',
            hello: 'lalal',
            createdAt: '2024',
          },
          {
            id: '12312',
            hello: 'sdasda',
            createdAt: '2022',
          },
        ],
      },

      UnprocessedKeys: {
        table: {
          Keys: [
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: [
          {
            id: '43523452',
            hello: 'dsfsdfd',
            createdAt: '2021',
          },
        ],
      },
    });

    const batchGetMock = jest.fn().mockReturnValue({
      promise: promiseMock,
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        batchGet: batchGetMock,
      } as any,
    });

    const result = await batchGetter.batchGet({
      table: 'table',
      keys: [
        {
          id: '23023',
          hello: 'lalal',
        },
        {
          id: '12312',
          hello: 'sdasda',
        },
        {
          id: '43523452',
          hello: 'dsfsdfd',
        },
      ],
    });

    expect(batchGetMock).toHaveBeenCalledTimes(2);
    expect(batchGetMock).toHaveBeenNthCalledWith(1, {
      RequestItems: {
        table: {
          Keys: [
            {
              id: '23023',
              hello: 'lalal',
            },
            {
              id: '12312',
              hello: 'sdasda',
            },
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });
    expect(batchGetMock).toHaveBeenNthCalledWith(2, {
      RequestItems: {
        table: {
          Keys: [
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    expect(result).toEqual([
      {
        id: '23023',
        hello: 'lalal',
        createdAt: '2024',
      },
      {
        id: '12312',
        hello: 'sdasda',
        createdAt: '2022',
      },
      {
        id: '43523452',
        hello: 'dsfsdfd',
        createdAt: '2021',
      },
    ]);
  });

  it('should handle UnprocessedKeys up to 8 times, returning whatever keys were found', async () => {
    const setTimeoutMock = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn();
      return 0 as any;
    });

    const promiseMock = jest.fn();

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: [
          {
            id: '23023',
            hello: 'lalal',
            createdAt: '2024',
          },
          {
            id: '12312',
            hello: 'sdasda',
            createdAt: '2022',
          },
        ],
      },

      UnprocessedKeys: {
        table: {
          Keys: [
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    promiseMock.mockResolvedValue({
      Responses: {
        table: [],
      },

      UnprocessedKeys: {
        table: {
          Keys: [
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    const batchGetMock = jest.fn().mockReturnValue({
      promise: promiseMock,
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        batchGet: batchGetMock,
      } as any,
    });

    const result = await batchGetter.batchGet({
      table: 'table',
      keys: [
        {
          id: '23023',
          hello: 'lalal',
        },
        {
          id: '12312',
          hello: 'sdasda',
        },
        {
          id: '43523452',
          hello: 'dsfsdfd',
        },
      ],
    });

    expect(batchGetMock).toHaveBeenCalledTimes(8);

    expect(result).toEqual([
      {
        id: '23023',
        hello: 'lalal',
        createdAt: '2024',
      },
      {
        id: '12312',
        hello: 'sdasda',
        createdAt: '2022',
      },
    ]);

    setTimeoutMock.mockRestore();
  });

  it('should handle UnprocessedKeys up to 8 times, throwing if instructed to', async () => {
    const promiseMock = jest.fn();

    promiseMock.mockResolvedValueOnce({
      Responses: {
        table: [
          {
            id: '23023',
            hello: 'lalal',
            createdAt: '2024',
          },
          {
            id: '12312',
            hello: 'sdasda',
            createdAt: '2022',
          },
        ],
      },

      UnprocessedKeys: {
        table: {
          Keys: [
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    promiseMock.mockResolvedValue({
      Responses: {
        table: [],
      },

      UnprocessedKeys: {
        table: {
          Keys: [
            {
              id: '43523452',
              hello: 'dsfsdfd',
            },
          ],
        },
      },
    });

    const batchGetMock = jest.fn().mockReturnValue({
      promise: promiseMock,
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        batchGet: batchGetMock,
      } as any,
    });

    const call = async () => {
      await batchGetter.batchGet({
        table: 'table',
        throwOnUnprocessed: true,
        keys: [
          {
            id: '23023',
            hello: 'lalal',
          },
          {
            id: '12312',
            hello: 'sdasda',
          },
          {
            id: '43523452',
            hello: 'dsfsdfd',
          },
        ],
      });
    };

    await expect(call()).rejects.toThrow();

    expect(batchGetMock).toHaveBeenCalledTimes(8);
  });
});
