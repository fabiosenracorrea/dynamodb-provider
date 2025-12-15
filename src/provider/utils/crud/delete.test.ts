/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  buildConditionExpression,
  getConditionExpressionNames,
  getConditionExpressionValues,
} from '../conditions';
import { fakeDBCommands } from '../dynamoDB/commands.fake';
import { ItemRemover } from './delete';

// simple helper to not bother mocking print log
const toJSON = (v: any): string => JSON.stringify(v, null, 2);

describe('DeleteItem actions', () => {
  describe('deletion', () => {
    it('v2: should properly call dynamodb delete operation', async () => {
      const deleteMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const remover = new ItemRemover({
        dynamoDB: {
          target: 'v2',
          instance: {
            delete: deleteMock,
          } as any,
        },
      });

      await remover.delete({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith({
        TableName: 'table',
        Key: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('v3: should properly call dynamodb delete operation', async () => {
      const deleteMock = jest.fn().mockReturnValue({});

      const remover = new ItemRemover({
        dynamoDB: {
          target: 'v3',
          commands: fakeDBCommands,
          instance: {
            send: deleteMock,
          } as any,
        },
      });

      await remover.delete({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith(
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

    it('v2: should properly build conditions with its helpers', async () => {
      const deleteMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const remover = new ItemRemover({
        dynamoDB: {
          target: 'v2',
          instance: {
            delete: deleteMock,
          } as any,
        },
      });

      const conditions = [
        {
          operation: 'equal' as const,
          value: 20,
          property: 'some',
        },
        {
          operation: 'in' as const,
          values: [1, 2, 3],
          property: 'list',
        },
      ];

      await remover.delete<any>({
        table: 'table',
        conditions,
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        // These helpers have their own testing
        // and are here because are the only source of Condition transformations
        // that should be used across the provider

        ConditionExpression: buildConditionExpression(conditions),

        ExpressionAttributeNames: getConditionExpressionNames(conditions),

        ExpressionAttributeValues: getConditionExpressionValues(conditions),
      });
    });

    it('v3: should properly build conditions with its helpers', async () => {
      const deleteMock = jest.fn().mockReturnValue({});

      const remover = new ItemRemover({
        dynamoDB: {
          target: 'v3',
          commands: fakeDBCommands,
          instance: {
            send: deleteMock,
          } as any,
        },
      });

      const conditions = [
        {
          operation: 'equal' as const,
          value: 20,
          property: 'some',
        },
        {
          operation: 'in' as const,
          values: [1, 2, 3],
          property: 'list',
        },
      ];

      await remover.delete<any>({
        table: 'table',
        conditions,
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'table',

            Key: {
              id: '23023',
              hello: 'lalal',
            },

            // These helpers have their own testing
            // and are here because are the only source of Condition transformations
            // that should be used across the provider

            ConditionExpression: buildConditionExpression(conditions),

            ExpressionAttributeNames: getConditionExpressionNames(conditions),

            ExpressionAttributeValues: getConditionExpressionValues(conditions),
          },
        }),
      );
    });

    it('v2: should log dynamodb params if option is passed', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const remover = new ItemRemover({
        logCallParams: true,

        dynamoDB: {
          target: 'v2',
          instance: {
            delete: () => ({
              promise: () => {},
            }),
          } as any,
        },
      });

      await remover.delete({
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

      const remover = new ItemRemover({
        logCallParams: true,

        dynamoDB: {
          target: 'v3',
          commands: fakeDBCommands,
          instance: {
            send: () => {},
          } as any,
        },
      });

      await remover.delete({
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

  describe('deletion params generation', () => {
    it('should properly build PutItem params', async () => {
      const remover = new ItemRemover({
        dynamoDB: {} as any,
      });

      const params = remover.getDeleteParams({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(params).toStrictEqual({
        TableName: 'table',
        Key: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('should properly build conditions with its helpers', async () => {
      const remover = new ItemRemover({
        dynamoDB: {} as any,
      });

      const conditions = [
        {
          operation: 'equal' as const,
          value: 20,
          property: 'some',
        },
        {
          operation: 'in' as const,
          values: [1, 2, 3],
          property: 'list',
        },
      ];

      const params = remover.getDeleteParams<any>({
        table: 'table',
        conditions,
        key: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(params).toStrictEqual({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        // These helpers have their own testing
        // and are here because are the only source of Condition transformations
        // that should be used across the provider

        ConditionExpression: buildConditionExpression(conditions),

        ExpressionAttributeNames: getConditionExpressionNames(conditions),

        ExpressionAttributeValues: getConditionExpressionValues(conditions),
      });
    });
  });
});
