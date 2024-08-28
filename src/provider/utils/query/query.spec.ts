/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getFilterParams } from '../filters';
import { toPaginationToken } from '../pagination';
import { QueryBuilder } from './query';

describe('query builder', () => {
  describe('general param usage', () => {
    it('should properly can the dynamodb query operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      await queryBuilder.query({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });
    });

    it('should properly can the dynamodb adjust ScanIndexForward based on direction', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      await queryBuilder.query({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: false,

        KeyConditionExpression: '(#id = :id)',

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });
    });

    it('should properly can the dynamodb add the Index if received', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      await queryBuilder.query({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',

        index: 'INDEX_NAME',
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: false,

        IndexName: 'INDEX_NAME',

        KeyConditionExpression: '(#id = :id)',

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });
    });

    it('should properly can the dynamodb add the Limit param if received', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      await queryBuilder.query({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',

        index: 'INDEX_NAME',

        limit: 10,
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: false,

        IndexName: 'INDEX_NAME',

        KeyConditionExpression: '(#id = :id)',

        Limit: 10,

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });
    });

    it('should handle a valid paginationToken', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      const paginationTokenItem = {
        id: 'zex',
        timestamp: 'something',
      };

      await queryBuilder.query({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',

        index: 'INDEX_NAME',

        limit: 10,

        paginationToken: toPaginationToken(paginationTokenItem),
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: false,

        IndexName: 'INDEX_NAME',

        KeyConditionExpression: '(#id = :id)',

        Limit: 10,

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },

        ExclusiveStartKey: paginationTokenItem,
      });
    });

    it('should handle an invalid paginationToken', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      await queryBuilder.query({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',

        index: 'INDEX_NAME',

        limit: 10,

        paginationToken: 'INVALID',
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: false,

        IndexName: 'INDEX_NAME',

        KeyConditionExpression: '(#id = :id)',

        Limit: 10,

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });

      consoleLogMock.mockRestore();
    });

    it('should handle filters', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          query: queryMock,
        } as any,
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        hashKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',

        index: 'INDEX_NAME',

        limit: 10,

        filters: {
          timestamp: 'something',
          status: ['0', '1', '2'],
          count: {
            operation: 'bigger_than',
            value: 0,
          },
        },
      });

      const filterParams = getFilterParams({
        timestamp: 'something',
        status: ['0', '1', '2'],
        count: {
          operation: 'bigger_than',
          value: 0,
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: false,

        IndexName: 'INDEX_NAME',

        KeyConditionExpression: '(#id = :id)',

        Limit: 10,

        ...filterParams,

        ExpressionAttributeNames: {
          '#id': 'id',
          ...filterParams.ExpressionAttributeNames,
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ...filterParams.ExpressionAttributeValues,
        },
      });
    });
  });

  describe('retrieval strategies/logics', () => {
    // fullRetrieval = true/default
    // fullRetrieval = false
    // fullRetrieval + limit
    // LastEvaluatedKey evaluations
  });
});
