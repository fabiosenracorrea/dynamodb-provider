/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getFilterParams } from '../filters';
import { toPaginationToken } from '../pagination';
import { getProjectionExpression, getProjectionExpressionNames } from '../projection';
import { QueryBuilder } from './query';

describe('query builder', () => {
  describe('general param usage', () => {
    it('should properly can the dynamodb query operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const paginationTokenItem = {
        id: 'zex',
        timestamp: 'something',
      };

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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

    it('should handle propertiesToRetrieve', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        propertiesToRetrieve: ['name', 'email', 'age'],
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        ProjectionExpression: getProjectionExpression(['name', 'email', 'age']),

        ExpressionAttributeNames: {
          '#id': 'id',
          ...getProjectionExpressionNames(['name', 'email', 'age']),
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });
    });

    it('should handle filters', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
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
    it('should, by default, fully retrieve the query', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'a' },
          { id: 'xx', name: 'b' },
        ],

        LastEvaluatedKey: { id: 'xx', name: 'b' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'c' },
          { id: 'xx', name: 'd' },
        ],
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'xx',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'xx',
        },
      });

      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'xx',
        },

        ExclusiveStartKey: { id: 'xx', name: 'b' },
      });

      expect(result.items).toStrictEqual([
        { id: 'xx', name: 'a' },
        { id: 'xx', name: 'b' },
        { id: 'xx', name: 'c' },
        { id: 'xx', name: 'd' },
      ]);
    });

    it('should handle paginated results if fully retrieval is turned off', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'a' },
          { id: 'xx', name: 'b' },
        ],

        LastEvaluatedKey: { id: 'xx', name: 'b' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'c' },
          { id: 'xx', name: 'd' },
        ],
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.query<any>({
        table: 'some_table',

        fullRetrieval: false,

        partitionKey: {
          name: 'id',
          value: 'xx',
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
          ':id': 'xx',
        },
      });

      expect(result.items).toStrictEqual([
        { id: 'xx', name: 'a' },
        { id: 'xx', name: 'b' },
      ]);

      expect(result.paginationToken).toEqual(toPaginationToken({ id: 'xx', name: 'b' }));
    });

    it('should respect limit even with fully retrieval on', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'a' },
          { id: 'xx', name: 'b' },
          { id: 'xx', name: 'c' },
          { id: 'xx', name: 'd' },
          { id: 'xx', name: 'e' },
        ],

        LastEvaluatedKey: { id: 'xx', name: 'e' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'f' },
          { id: 'xx', name: 'g' },
        ],
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.query<any>({
        table: 'some_table',

        fullRetrieval: true,
        limit: 5,

        partitionKey: {
          name: 'id',
          value: 'xx',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        Limit: 5,

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'xx',
        },
      });

      expect(result.items).toStrictEqual([
        { id: 'xx', name: 'a' },
        { id: 'xx', name: 'b' },
        { id: 'xx', name: 'c' },
        { id: 'xx', name: 'd' },
        { id: 'xx', name: 'e' },
      ]);
    });

    it('should adjust multiple queries if limit/fully retrieval are on', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'a' },
          { id: 'xx', name: 'b' },
          { id: 'xx', name: 'c' },
          { id: 'xx', name: 'd' },
          { id: 'xx', name: 'e' },
        ],

        LastEvaluatedKey: { id: 'xx', name: 'e' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'f' },
          { id: 'xx', name: 'g' },
          { id: 'xx', name: 'h' },
          { id: 'xx', name: 'i' },
          { id: 'xx', name: 'j' },
        ],
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        fullRetrieval: true,
        limit: 7,

        partitionKey: {
          name: 'id',
          value: 'xx',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        Limit: 7,

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'xx',
        },
      });
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id)',

        Limit: 2,

        ExclusiveStartKey: { id: 'xx', name: 'e' },

        ExpressionAttributeNames: {
          '#id': 'id',
        },

        ExpressionAttributeValues: {
          ':id': 'xx',
        },
      });
    });
  });

  describe('range key operations', () => {
    it('should handle the *equal* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'equal',
          name: 'rangeKey',
          value: 'rangeValue',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (#rangeKey = :rangeKey)',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
        },
      });
    });

    it('should handle the *lower_than* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'lower_than',
          name: 'rangeKey',
          value: 'rangeValue',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (#rangeKey < :rangeKey)',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
        },
      });
    });

    it('should handle the *lower_or_equal_than* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'lower_or_equal_than',
          name: 'rangeKey',
          value: 'rangeValue',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (#rangeKey <= :rangeKey)',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
        },
      });
    });

    it('should handle the *bigger_than* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'bigger_than',
          name: 'rangeKey',
          value: 'rangeValue',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (#rangeKey > :rangeKey)',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
        },
      });
    });

    it('should handle the *bigger_or_equal_than* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'bigger_or_equal_than',
          name: 'rangeKey',
          value: 'rangeValue',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (#rangeKey >= :rangeKey)',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
        },
      });
    });

    it('should handle the *begins_with* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'begins_with',
          name: 'rangeKey',
          value: 'rangeValue',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (begins_with(#rangeKey, :rangeKey))',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
        },
      });
    });

    it('should handle the *between* range operation', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'between',
          name: 'rangeKey',
          start: 'rangeStart',
          end: 'rangeEnd',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression:
          '(#id = :id) and (#rangeKey between :rangeKey_start and :rangeKey_end)',

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey_start': 'rangeStart',
          ':rangeKey_end': 'rangeEnd',
        },
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle propertiesToRetrieve with filters and range keys', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        rangeKey: {
          operation: 'begins_with',
          name: 'rangeKey',
          value: 'rangeValue',
        },

        propertiesToRetrieve: ['name', 'email'],

        filters: {
          status: 'active',
        },
      });

      const filterParams = getFilterParams({
        status: 'active',
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',

        ScanIndexForward: true,

        KeyConditionExpression: '(#id = :id) and (begins_with(#rangeKey, :rangeKey))',

        ProjectionExpression: getProjectionExpression(['name', 'email']),

        ...filterParams,

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
          ...getProjectionExpressionNames(['name', 'email']),
          ...filterParams.ExpressionAttributeNames,
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
          ...filterParams.ExpressionAttributeValues,
        },
      });
    });

    it('should handle all params', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.query<any>({
        table: 'some_table',

        partitionKey: {
          name: 'id',
          value: 'someId',
        },

        retrieveOrder: 'DESC',

        index: 'INDEX_NAME',

        limit: 10,

        rangeKey: {
          operation: 'begins_with',
          name: 'rangeKey',
          value: 'rangeValue',
        },

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

        KeyConditionExpression: '(#id = :id) and (begins_with(#rangeKey, :rangeKey))',

        Limit: 10,

        ...filterParams,

        ExpressionAttributeNames: {
          '#id': 'id',
          '#rangeKey': 'rangeKey',
          ...filterParams.ExpressionAttributeNames,
        },

        ExpressionAttributeValues: {
          ':id': 'someId',
          ':rangeKey': 'rangeValue',
          ...filterParams.ExpressionAttributeValues,
        },
      });
    });
  });

  describe('queryOne', () => {
    it('should query for a single item and return it', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'xx', name: 'a' }],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryOne<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',
        ScanIndexForward: true,
        KeyConditionExpression: '(#id = :id)',
        Limit: 1,
        ExpressionAttributeNames: {
          '#id': 'id',
        },
        ExpressionAttributeValues: {
          ':id': 'someId',
        },
      });

      expect(result).toEqual({ id: 'xx', name: 'a' });
    });

    it('should return undefined when no items found', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryOne<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
      });

      expect(result).toBeUndefined();
    });

    it('should support range key conditions', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'xx', sk: 'DATA#123', name: 'test' }],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryOne<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        rangeKey: {
          name: 'sk',
          operation: 'begins_with',
          value: 'DATA',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith({
        TableName: 'some_table',
        ScanIndexForward: true,
        KeyConditionExpression: '(#id = :id) and (begins_with(#sk, :sk))',
        Limit: 1,
        ExpressionAttributeNames: {
          '#id': 'id',
          '#sk': 'sk',
        },
        ExpressionAttributeValues: {
          ':id': 'someId',
          ':sk': 'DATA',
        },
      });

      expect(result).toEqual({ id: 'xx', sk: 'DATA#123', name: 'test' });
    });

    it('should support filters', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'xx', name: 'a', status: 'active' }],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryOne<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        filters: {
          status: 'active',
        },
      });

      expect(result).toEqual({ id: 'xx', name: 'a', status: 'active' });
    });

    it('should support propertiesToRetrieve', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'xx', name: 'a' }],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.queryOne<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        propertiesToRetrieve: ['id', 'name'],
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ProjectionExpression: expect.any(String),
        }),
      );
    });

    it('should support index queries', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ gsi1pk: 'value', data: 'test' }],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.queryOne<any>({
        table: 'some_table',
        index: 'GSI1',
        partitionKey: {
          name: 'gsi1pk',
          value: 'value',
        },
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'GSI1',
        }),
      );
    });

    it('should support retrieveOrder', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ id: 'xx', name: 'z' }],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.queryOne<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        retrieveOrder: 'DESC',
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ScanIndexForward: false,
        }),
      );
    });
  });

  describe('queryAll', () => {
    it('should query for all items and return array', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'a' },
          { id: 'xx', name: 'b' },
        ],
        LastEvaluatedKey: { id: 'xx', name: 'b' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'c' },
          { id: 'xx', name: 'd' },
        ],
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'xx',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { id: 'xx', name: 'a' },
        { id: 'xx', name: 'b' },
        { id: 'xx', name: 'c' },
        { id: 'xx', name: 'd' },
      ]);
    });

    it('should return empty array when no items found', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
      });

      expect(result).toEqual([]);
    });

    it('should support range key conditions', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { id: 'xx', sk: 'DATA#1' },
            { id: 'xx', sk: 'DATA#2' },
          ],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        rangeKey: {
          name: 'sk',
          operation: 'begins_with',
          value: 'DATA',
        },
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'xx', sk: 'DATA#1' },
        { id: 'xx', sk: 'DATA#2' },
      ]);
    });

    it('should support filters', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { id: 'xx', name: 'a', status: 'active' },
            { id: 'xx', name: 'b', status: 'active' },
          ],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        filters: {
          status: 'active',
        },
      });

      expect(result).toHaveLength(2);
    });

    it('should support propertiesToRetrieve', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { id: 'xx', name: 'a' },
            { id: 'yy', name: 'b' },
          ],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        propertiesToRetrieve: ['id', 'name'],
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ProjectionExpression: expect.any(String),
        }),
      );
    });

    it('should support index queries', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { gsi1pk: 'value', data: 'test1' },
            { gsi1pk: 'value', data: 'test2' },
          ],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.queryAll<any>({
        table: 'some_table',
        index: 'GSI1',
        partitionKey: {
          name: 'gsi1pk',
          value: 'value',
        },
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'GSI1',
        }),
      );
    });

    it('should support retrieveOrder', async () => {
      const queryMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { id: 'xx', name: 'z' },
            { id: 'xx', name: 'y' },
          ],
        }),
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'someId',
        },
        retrieveOrder: 'DESC',
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ScanIndexForward: false,
        }),
      );
    });

    it('should auto-paginate by default', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [{ id: 'xx', name: 'a' }],
        LastEvaluatedKey: { id: 'xx', name: 'a' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [{ id: 'xx', name: 'b' }],
        LastEvaluatedKey: { id: 'xx', name: 'b' },
      });

      promiseMock.mockResolvedValueOnce({
        Items: [{ id: 'xx', name: 'c' }],
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'xx',
        },
      });

      expect(queryMock).toHaveBeenCalledTimes(3);
      expect(result).toEqual([
        { id: 'xx', name: 'a' },
        { id: 'xx', name: 'b' },
        { id: 'xx', name: 'c' },
      ]);
    });

    it('should support limit parameter as total limit', async () => {
      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: [
          { id: 'xx', name: 'a' },
          { id: 'xx', name: 'b' },
        ],
        LastEvaluatedKey: { id: 'xx', name: 'b' },
      });

      const queryMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const queryBuilder = new QueryBuilder({
        dynamoDB: {
          target: 'v2',
          instance: {
            query: queryMock,
          } as any,
        },
      });

      const result = await queryBuilder.queryAll<any>({
        table: 'some_table',
        partitionKey: {
          name: 'id',
          value: 'xx',
        },
        limit: 2,
      });

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          Limit: 2,
        }),
      );
      expect(result).toEqual([
        { id: 'xx', name: 'a' },
        { id: 'xx', name: 'b' },
      ]);
    });
  });
});
