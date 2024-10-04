/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProjectExpressionParams } from '../projection';
import { ItemGetter } from './get';

// simple helper to not bother mocking print log
const toJSON = (v: any): string => JSON.stringify(v, null, 2);

describe('GetItem actions', () => {
  describe('get item', () => {
    it('v2: should properly call dynamodb get operation', async () => {
      const item = {
        id: '23023',
        hello: 'lalal',
        name: 'fale',
        date: '1203021',
      };

      const getMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: item,
        }),
      });

      const getter = new ItemGetter({
        dynamoDB: {
          target: 'v2',
          instance: {
            get: getMock,
          } as any,
        },
      });

      const result = await getter.get<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(item);
      expect(getMock).toHaveBeenCalledWith({
        TableName: 'table',
        Key: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('v3: should properly call dynamodb get operation', async () => {
      const item = {
        id: '23023',
        hello: 'lalal',
        name: 'fale',
        date: '1203021',
      };

      const send = jest.fn().mockReturnValue({
        Item: item,
      });

      const getter = new ItemGetter({
        dynamoDB: {
          target: 'v3',
          instance: {
            send,
          } as any,
        },
      });

      const result = await getter.get<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(send).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(item);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'table',
            Key: {
              id: '23023',
              hello: 'lalal',
            },
          },
        }),
      );
    });

    it('v2: should properly add the ConsistentRead param', async () => {
      const getMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const getter = new ItemGetter({
        dynamoDB: {
          target: 'v2',
          instance: {
            get: getMock,
          } as any,
        },
      });

      await getter.get<any>({
        table: 'table',
        consistentRead: true,
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        Key: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('v3: should properly add the ConsistentRead param', async () => {
      const sendMock = jest.fn().mockReturnValue({});

      const getter = new ItemGetter({
        dynamoDB: {
          target: 'v3',
          instance: {
            send: sendMock,
          } as any,
        },
      });

      await getter.get<any>({
        table: 'table',
        consistentRead: true,
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'table',
            ConsistentRead: true,
            Key: {
              id: '23023',
              hello: 'lalal',
            },
          },
        }),
      );
    });

    it('v2: should properly build projection properties with its helpers', async () => {
      const getMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const getter = new ItemGetter({
        dynamoDB: {
          target: 'v2',
          instance: {
            get: getMock,
          } as any,
        },
      });

      await getter.get<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
        propertiesToRetrieve: ['hello', 'id', 'createdAt'],
      });

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        // These helpers have their own testing
        // and are here because are the only source of Project Expression transformations
        // that should be used across the provider

        ...getProjectExpressionParams(['hello', 'id', 'createdAt']),
      });
    });

    it('v3: should properly build projection properties with its helpers', async () => {
      const sendMock = jest.fn().mockReturnValue({});

      const getter = new ItemGetter({
        dynamoDB: {
          target: 'v3',
          instance: {
            send: sendMock,
          } as any,
        },
      });

      await getter.get<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
        propertiesToRetrieve: ['hello', 'id', 'createdAt'],
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'table',

            Key: {
              id: '23023',
              hello: 'lalal',
            },

            // These helpers have their own testing
            // and are here because are the only source of Project Expression transformations
            // that should be used across the provider

            ...getProjectExpressionParams(['hello', 'id', 'createdAt']),
          },
        }),
      );
    });

    it('v2: should log dynamodb params if option is passed', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const getter = new ItemGetter({
        logCallParams: true,

        dynamoDB: {
          target: 'v2',
          instance: {
            get: () => ({
              promise: () => ({}),
            }),
          } as any,
        },
      });

      await getter.get<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(consoleLogMock).toHaveBeenCalledWith(
        toJSON({
          TableName: 'table',
          Key: {
            id: '23023',
            hello: 'lalal',
          },
        }),
      );

      consoleLogMock.mockRestore();
    });

    it('v3: should log dynamodb params if option is passed', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const getter = new ItemGetter({
        logCallParams: true,

        dynamoDB: {
          target: 'v3',
          instance: {
            send: () => ({}),
          } as any,
        },
      });

      await getter.get<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(consoleLogMock).toHaveBeenCalledWith(
        toJSON({
          TableName: 'table',
          Key: {
            id: '23023',
            hello: 'lalal',
          },
        }),
      );

      consoleLogMock.mockRestore();
    });
  });
});
