/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect } from 'types';
import { getFilterParams } from '../filters';
import { toPaginationToken } from '../pagination';
import { getProjectionExpression, getProjectionExpressionNames } from '../projection';

import { ItemLister } from './list';

describe('Lister', () => {
  describe('standard list', () => {
    it('should properly call the dynamoDB scan operation', async () => {
      const items = [
        { id: 1, name: 'fa' },
        { id: 2, name: 'ga' },
        { id: 3, name: 'ha' },
      ];

      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: items,
        }),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      const result = await lister.list('table');

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
      });

      expect(result.items).toBe(items);
    });

    it('should apply ConsistentRead if param received', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      await lister.list('table', {
        consistentRead: true,
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
      });
    });

    it('should apply Index if param received', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      await lister.list('table', {
        consistentRead: true,
        index: 'SomeIndex',
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        IndexName: 'SomeIndex',
      });
    });

    it('should apply Limit if param received', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      await lister.list('table', {
        consistentRead: true,
        index: 'SomeIndex',
        limit: 40,
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        IndexName: 'SomeIndex',
        Limit: 40,
      });
    });

    it('should apply Parallel Scan params if param received', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      await lister.list('table', {
        consistentRead: true,
        index: 'SomeIndex',
        limit: 40,
        parallelRetrieval: {
          segment: 0,
          total: 3,
        },
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        IndexName: 'SomeIndex',
        Limit: 40,
        Segment: 0,
        TotalSegments: 3,
      });
    });

    it('should apply Projection params if applicable - propertiesToRetrieve', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      const properties = ['name', 'age', 'id'];

      await lister.list<any>('table', {
        consistentRead: true,
        index: 'SomeIndex',
        limit: 40,

        propertiesToRetrieve: properties,

        parallelRetrieval: {
          segment: 0,
          total: 3,
        },
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        IndexName: 'SomeIndex',
        Limit: 40,
        Segment: 0,
        TotalSegments: 3,

        ProjectionExpression: getProjectionExpression(properties),
        ExpressionAttributeNames: getProjectionExpressionNames(properties),
      });
    });

    it('should apply Direct filter params if applicable', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      const properties = ['name', 'age', 'id'];

      await lister.list<any>('table', {
        consistentRead: true,
        index: 'SomeIndex',
        limit: 40,

        propertiesToRetrieve: properties,

        filters: {
          age: 17,
          state: ['MG', 'SP'],
        },

        parallelRetrieval: {
          segment: 0,
          total: 3,
        },
      });

      const filterParams = getFilterParams({
        age: 17,
        state: ['MG', 'SP'],
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        IndexName: 'SomeIndex',
        Limit: 40,
        Segment: 0,
        TotalSegments: 3,

        ...filterParams,
        ProjectionExpression: getProjectionExpression(properties),
        ExpressionAttributeNames: {
          ...getProjectionExpressionNames(properties),
          ...filterParams.ExpressionAttributeNames,
        },
      });
    });

    it('should apply Complex filter params if applicable', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      const properties = ['name', 'age', 'id'];

      await lister.list<any>('table', {
        consistentRead: true,
        index: 'SomeIndex',
        limit: 40,

        propertiesToRetrieve: properties,

        filters: {
          age: 17,
          state: ['MG', 'SP'],
          birthDay: {
            operation: 'between',
            start: '1995-01-31',
            end: '1995-12-31',
          },
        },

        parallelRetrieval: {
          segment: 0,
          total: 3,
        },
      });

      const filterParams = getFilterParams({
        age: 17,
        state: ['MG', 'SP'],
        birthDay: {
          operation: 'between',
          start: '1995-01-31',
          end: '1995-12-31',
        },
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
        ConsistentRead: true,
        IndexName: 'SomeIndex',
        Limit: 40,
        Segment: 0,
        TotalSegments: 3,

        ...filterParams,
        ProjectionExpression: getProjectionExpression(properties),
        ExpressionAttributeNames: {
          ...getProjectionExpressionNames(properties),
          ...filterParams.ExpressionAttributeNames,
        },
      });
    });

    it('should properly return paginationToken', async () => {
      const fakeLastKey = {
        id: '11',
        name: 'fa',
      };

      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
          LastEvaluatedKey: fakeLastKey,
        }),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      const result = await lister.list<any>('table');

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
      });

      expect(result.paginationToken).toBeDefined();
      expect(result.paginationToken).toBe(toPaginationToken(fakeLastKey));
    });

    it('should properly accept paginationToken', async () => {
      const fakeLastKey = {
        id: '11',
        name: 'fa',
      };

      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      await lister.list<any>('table', {
        paginationToken: toPaginationToken(fakeLastKey),
      });

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',

        ExclusiveStartKey: fakeLastKey,
      });
    });

    it('[TYPES] Should return {items, paginationToken?}', async () => {
      const fakeLastKey = {
        id: '11',
        name: 'fa',
      };

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: jest.fn().mockReturnValue({
              promise: jest.fn().mockResolvedValue({}),
            }),
          } as any,
        },
      });

      type User = {
        name: string;
        id: string;
      };

      const result = await lister.list<User>('table', {
        paginationToken: toPaginationToken(fakeLastKey),
      });

      type _R = Expect<Equal<typeof result, { paginationToken?: string; items: User[] }>>;
    });

    it('[TYPES] propertiesToRetrieve should narrow to type param', async () => {
      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: jest.fn().mockReturnValue({
              promise: jest.fn().mockResolvedValue({}),
            }),
          } as any,
        },
      });

      type User = {
        name: string;
        id: string;
      };

      lister.list<User>('table', {
        propertiesToRetrieve: ['id', 'name'],
      });

      lister.list<User>('table', {
        // @ts-expect-error no invalid properties referenced
        propertiesToRetrieve: ['bad_prop'],
      });
    });

    it('[TYPES] filter should narrow to type param', async () => {
      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: jest.fn().mockReturnValue({
              promise: jest.fn().mockResolvedValue({}),
            }),
          } as any,
        },
      });

      type User = {
        name: string;
        id: string;
      };

      lister.list<User>('table', {
        filters: {
          id: '1',
          name: ['abel', 'carlo'],
        },
      });

      lister.list<User>('table', {
        filters: {
          // @ts-expect-error no invalid properties referenced
          _bad: '1',
        },
      });
    });
  });

  describe('list all', () => {
    it('should properly handle sequential loads', async () => {
      const firstItems = [
        { id: 1, name: 'fa' },
        { id: 2, name: 'ga' },
        { id: 3, name: 'ha' },
      ];

      const fakeLastKey = {
        id: '11',
        name: 'fa',
      };

      const otherItems = [
        { id: 4, name: 'ia' },
        { id: 5, name: 'ja' },
        { id: 6, name: 'ka' },
      ];

      const promiseMock = jest.fn();

      promiseMock.mockResolvedValueOnce({
        Items: firstItems,
        LastEvaluatedKey: fakeLastKey,
      });

      promiseMock.mockResolvedValueOnce({
        Items: otherItems,
      });

      const scanMock = jest.fn().mockReturnValue({
        promise: promiseMock,
      });

      const lister = new ItemLister({
        dynamoDB: {
          target: 'v2',
          instance: {
            scan: scanMock,
          } as any,
        },
      });

      const allItems = await lister.listAll<any>('table');

      expect(scanMock).toHaveBeenCalledTimes(2);
      expect(scanMock).toHaveBeenNthCalledWith(1, {
        TableName: 'table',
      });
      expect(scanMock).toHaveBeenNthCalledWith(2, {
        TableName: 'table',
        ExclusiveStartKey: fakeLastKey,
      });

      expect(allItems).toEqual([...firstItems, ...otherItems]);
    });
  });
});
