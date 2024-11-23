/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  buildConditionExpression,
  getConditionExpressionNames,
  getConditionExpressionValues,
} from '../conditions';
import { ItemCreator } from './create';
import { fakeDBCommands } from '../dynamoDB/commands.fake';

// simple helper to not bother mocking print log
const toJSON = (v: any): string => JSON.stringify(v, null, 2);

describe('CreateItem actions', () => {
  describe('creation', () => {
    it('v2: should properly call dynamodb put operation', async () => {
      const putMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const creator = new ItemCreator({
        dynamoDB: {
          target: 'v2',
          instance: {
            put: putMock,
          } as any,
        },
      });

      await creator.create({
        table: 'table',
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith({
        TableName: 'table',
        Item: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('v3: should properly call dynamodb put operation', async () => {
      const putMock = jest.fn().mockReturnValue({});

      const creator = new ItemCreator({
        dynamoDB: {
          target: 'v3',
          instance: {
            send: putMock,
          } as any,
          commands: fakeDBCommands,
        },
      });

      await creator.create({
        table: 'table',
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'table',
            Item: {
              id: '23023',
              hello: 'lalal',
            },
          },
        }),
      );
    });

    it('v2: should properly build conditions with its helpers', async () => {
      const putMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const creator = new ItemCreator({
        dynamoDB: {
          target: 'v2',
          instance: {
            put: putMock,
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

      await creator.create<any>({
        table: 'table',
        conditions,
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith({
        TableName: 'table',

        Item: {
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
      const putMock = jest.fn().mockReturnValue({});

      const creator = new ItemCreator({
        dynamoDB: {
          target: 'v3',
          instance: {
            send: putMock,
          } as any,
          commands: fakeDBCommands,
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

      await creator.create<any>({
        table: 'table',
        conditions,
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'table',

            Item: {
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

      const creator = new ItemCreator({
        logCallParams: true,

        dynamoDB: {
          target: 'v2',
          instance: {
            put: () => ({
              promise: () => {},
            }),
          } as any,
        },
      });

      await creator.create({
        table: 'table',
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(consoleLogMock).toHaveBeenCalledWith(
        toJSON({
          TableName: 'table',
          Item: {
            id: '23023',
            hello: 'lalal',
          },
        }),
      );

      consoleLogMock.mockRestore();
    });

    it('v3: should log dynamodb params if option is passed', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const creator = new ItemCreator({
        logCallParams: true,

        dynamoDB: {
          target: 'v3',
          commands: fakeDBCommands,
          instance: {
            send: () => {},
          } as any,
        },
      });

      await creator.create({
        table: 'table',
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(consoleLogMock).toHaveBeenCalledWith(
        toJSON({
          TableName: 'table',
          Item: {
            id: '23023',
            hello: 'lalal',
          },
        }),
      );

      consoleLogMock.mockRestore();
    });
  });

  describe('creation params generation', () => {
    it('should properly build PutItem params', async () => {
      const creator = new ItemCreator({
        dynamoDB: {} as any,
      });

      const params = creator.getCreateParams({
        table: 'table',
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(params).toStrictEqual({
        TableName: 'table',
        Item: {
          id: '23023',
          hello: 'lalal',
        },
      });
    });

    it('should properly build conditions with its helpers', async () => {
      const creator = new ItemCreator({
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

      const params = creator.getCreateParams<any>({
        table: 'table',
        conditions,
        item: {
          id: '23023',
          hello: 'lalal',
        },
      });

      expect(params).toStrictEqual({
        TableName: 'table',

        Item: {
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
