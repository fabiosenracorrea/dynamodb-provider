/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BatchGetter } from './batchGet';

describe('batchGetter', () => {
  it('v2: should properly call the dynamodb BatchGet operation', async () => {
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
        target: 'v2',
        instance: {
          batchGet: batchGetMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
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

  it('v3: should properly call the dynamodb BatchGet operation', async () => {
    const sendMock = jest.fn().mockReturnValue({
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
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        target: 'v3',
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
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

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
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
        },
      }),
    );

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

  it('v2: should handle more than 100 keys', async () => {
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
        target: 'v2',
        instance: {
          batchGet: batchGetMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
      table: 'table',
      keys: items.map(({ id }) => ({
        id,
      })),
    });

    expect(batchGetMock).toHaveBeenCalledTimes(4);

    expect(result).toEqual(items);
  });

  it('v3: should handle more than 100 keys', async () => {
    const items = Array.from({ length: 310 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      someProp: Math.random(),
    }));

    const sendMock = jest.fn();

    sendMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(0, 100),
      },
    });

    sendMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(100, 200),
      },
    });

    sendMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(200, 300),
      },
    });

    sendMock.mockResolvedValueOnce({
      Responses: {
        table: items.slice(300),
      },
    });

    const batchGetter = new BatchGetter({
      dynamoDB: {
        target: 'v3',
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
      table: 'table',
      keys: items.map(({ id }) => ({
        id,
      })),
    });

    expect(sendMock).toHaveBeenCalledTimes(4);

    expect(result).toEqual(items);
  });

  it('v2: should handle UnprocessedKeys', async () => {
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
        target: 'v2',
        instance: {
          batchGet: batchGetMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
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

  it('v3: should handle UnprocessedKeys', async () => {
    const sendMock = jest.fn();

    sendMock.mockResolvedValueOnce({
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

    sendMock.mockResolvedValueOnce({
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

    const batchGetter = new BatchGetter({
      dynamoDB: {
        target: 'v3',
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
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

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        input: {
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
        },
      }),
    );
    expect(sendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        input: {
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
        },
      }),
    );

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

  it('v2: should handle UnprocessedKeys up to 8 times, returning whatever keys were found', async () => {
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
        target: 'v2',
        instance: {
          batchGet: batchGetMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
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

  it('v3: should handle UnprocessedKeys up to 8 times, returning whatever keys were found', async () => {
    const setTimeoutMock = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn();
      return 0 as any;
    });

    const sendMock = jest.fn();

    sendMock.mockResolvedValueOnce({
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

    sendMock.mockResolvedValue({
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

    const batchGetter = new BatchGetter({
      dynamoDB: {
        target: 'v3',
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
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

    expect(sendMock).toHaveBeenCalledTimes(8);

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

  it('v2: should handle UnprocessedKeys up to X times, if passed as argument', async () => {
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
        target: 'v2',
        instance: {
          batchGet: batchGetMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
      table: 'table',
      maxRetries: 5,
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

    expect(batchGetMock).toHaveBeenCalledTimes(5);

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

  it('v3: should handle UnprocessedKeys up to 8 times, returning whatever keys were found', async () => {
    const setTimeoutMock = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn();
      return 0 as any;
    });

    const sendMock = jest.fn();

    sendMock.mockResolvedValueOnce({
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

    sendMock.mockResolvedValue({
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

    const batchGetter = new BatchGetter({
      dynamoDB: {
        target: 'v3',
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const result = await batchGetter.batchGet<any>({
      table: 'table',
      maxRetries: 4,
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

    expect(sendMock).toHaveBeenCalledTimes(4);

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

  it('v2: should handle UnprocessedKeys up to 8 times, throwing if instructed to', async () => {
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
        target: 'v2',
        instance: {
          batchGet: batchGetMock,
        } as any,
      },
    });

    const call = async () => {
      await batchGetter.batchGet<any>({
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

    setTimeoutMock.mockRestore();
  });

  it('v3: should handle UnprocessedKeys up to 8 times, throwing if instructed to', async () => {
    const setTimeoutMock = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn();
      return 0 as any;
    });

    const sendMock = jest.fn();

    sendMock.mockResolvedValueOnce({
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

    sendMock.mockResolvedValue({
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

    const batchGetter = new BatchGetter({
      dynamoDB: {
        target: 'v3',
        instance: {
          send: sendMock,
        } as any,
      },
    });

    const call = async () => {
      await batchGetter.batchGet<any>({
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

    expect(sendMock).toHaveBeenCalledTimes(8);

    setTimeoutMock.mockRestore();
  });
});
