/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProjectExpressionParams } from '../projection';
import { ItemGetter } from './get';

// simple helper to not bother mocking print log
const toJSON = (v: any): string => JSON.stringify(v, null, 2);

describe('GetItem actions', () => {
  describe('get item', () => {
    it('should properly call dynamodb get operation', async () => {
      const getMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const getter = new ItemGetter({
        dynamoDB: {
          get: getMock,
        } as any,
      });

      await getter.get({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith({
        TableName: 'table',
        Key: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('should properly add the ConsistentRead param', async () => {
      const getMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const getter = new ItemGetter({
        dynamoDB: {
          get: getMock,
        } as any,
      });

      await getter.get({
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

    it('should properly build projection properties with its helpers', async () => {
      const getMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const getter = new ItemGetter({
        dynamoDB: {
          get: getMock,
        } as any,
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

    it('should log dynamodb params if option is passed', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const getter = new ItemGetter({
        logCallParams: true,

        dynamoDB: {
          get: () => ({
            promise: () => ({}),
          }),
        } as any,
      });

      await getter.get({
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
