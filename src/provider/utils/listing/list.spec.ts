/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProjectionExpression, getProjectionExpressionNames } from '../projection';

import { ItemLister } from './list';

describe('Lister', () => {
  describe('standard list', () => {
    it('should properly call the dynamoDB scan operation', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          scan: scanMock,
        } as any,
      });

      await lister.list('table');

      expect(scanMock).toHaveBeenCalledTimes(1);
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'table',
      });
    });

    it('should apply ConsistentRead if param received', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          scan: scanMock,
        } as any,
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
          scan: scanMock,
        } as any,
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
          scan: scanMock,
        } as any,
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
          scan: scanMock,
        } as any,
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

    it('should apply Projection params if applicable', async () => {
      const scanMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const lister = new ItemLister({
        dynamoDB: {
          scan: scanMock,
        } as any,
      });

      const properties = ['name', 'age', 'id'];

      await lister.list<any>('table', {
        consistentRead: true,
        index: 'SomeIndex',
        limit: 40,

        propertiesToGet: properties,

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
  });
});
