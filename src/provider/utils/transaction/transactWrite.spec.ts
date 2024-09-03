/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getConditionExpressionNames, getConditionExpressionValues } from '../conditions';
import { ItemCreator, ItemRemover, ItemUpdater } from '../crud';
import { buildExpression } from '../expressions';
import { TransactionWriter } from './transactionWrite';

describe('transactionWriter', () => {
  describe('param builder', () => {
    it('should properly suggest params based on items', () => {
      const writer = new TransactionWriter({
        dynamoDB: {} as any,
      });

      const items = [
        {
          name: 'John Doe',
          age: 28,
          dob: '1996-03-14',
          address: '123 Main St, Springfield, IL',
          type: 'user' as const,
        },
        {
          name: 'Jane Smith',
          age: 34,
          dob: '1990-08-22',
          address: '456 Elm St, Springfield, IL',
          type: 'admin' as const,
        },
        {
          name: 'Alice Johnson',
          age: 29,
          dob: '1995-12-01',
          address: '789 Oak St, Springfield, IL',
          type: 'user' as const,
        },
        {
          name: 'Bob Brown',
          age: 41,
          dob: '1983-07-15',
          address: '101 Maple St, Springfield, IL',
          type: 'user' as const,
        },
        {
          name: 'Charlie Davis',
          age: 37,
          dob: '1987-11-03',
          address: '202 Pine St, Springfield, IL',
          type: 'admin' as const,
        },
        {
          name: 'Emily Wilson',
          age: 25,
          dob: '1999-04-18',
          address: '303 Cedar St, Springfield, IL',
          type: 'user' as const,
        },
      ];

      const params = writer.generateTransactionConfigList(items, ({ name, type }) => [
        {
          update: {
            table: 'some_table',
            key: {
              name,
              type,
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
      ]);

      expect(params).toStrictEqual([
        {
          update: {
            table: 'some_table',
            key: {
              name: 'John Doe',
              type: 'user',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Jane Smith',
              type: 'admin',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Alice Johnson',
              type: 'user',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Bob Brown',
              type: 'user',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Emily Wilson',
              type: 'user',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
      ]);
    });

    it('should exclude null entries', () => {
      const writer = new TransactionWriter({
        dynamoDB: {} as any,
      });

      const items = [
        {
          name: 'John Doe',
          age: 28,
          dob: '1996-03-14',
          address: '123 Main St, Springfield, IL',
          type: 'user' as const,
        },
        {
          name: 'Jane Smith',
          age: 34,
          dob: '1990-08-22',
          address: '456 Elm St, Springfield, IL',
          type: 'admin' as const,
        },
        {
          name: 'Alice Johnson',
          age: 29,
          dob: '1995-12-01',
          address: '789 Oak St, Springfield, IL',
          type: 'user' as const,
        },
        {
          name: 'Bob Brown',
          age: 41,
          dob: '1983-07-15',
          address: '101 Maple St, Springfield, IL',
          type: 'user' as const,
        },
        {
          name: 'Charlie Davis',
          age: 37,
          dob: '1987-11-03',
          address: '202 Pine St, Springfield, IL',
          type: 'admin' as const,
        },
        {
          name: 'Emily Wilson',
          age: 25,
          dob: '1999-04-18',
          address: '303 Cedar St, Springfield, IL',
          type: 'user' as const,
        },
      ];

      const params = writer.generateTransactionConfigList(items, ({ name, type }) =>
        type === 'user'
          ? null
          : [
              {
                update: {
                  table: 'some_table',
                  key: {
                    name,
                    type,
                  },
                  values: {
                    age: 40,
                    marked: true,
                  },
                },
              },
            ],
      );

      expect(params).toStrictEqual([
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Jane Smith',
              type: 'admin',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
            values: {
              age: 40,
              marked: true,
            },
          },
        },
      ]);
    });
  });

  describe('transact params', () => {
    it('should properly call the dynamodb transactionWrite for creation', async () => {
      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      await writer.executeTransaction([
        {
          create: {
            table: 'some_table',
            item: {
              name: 'Charlie Davis',
              age: 37,
              dob: '1987-11-03',
              address: '202 Pine St, Springfield, IL',
              type: 'admin',
            },
          },
        },
        {
          create: {
            table: 'backup_table',
            item: {
              name: 'Charlie Davis',
              age: 37,
              dob: '1987-11-03',
              address: '202 Pine St, Springfield, IL',
              type: 'admin',
              timestamp: 'some_date',
              createdBy: 'admin_ultra',
            },
          },
        },
      ]);

      expect(transactMock).toHaveBeenCalledTimes(1);
      expect(transactMock).toHaveBeenCalledWith({
        TransactItems: [
          {
            Put: {
              TableName: 'some_table',
              Item: {
                name: 'Charlie Davis',
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
                type: 'admin',
              },
            },
          },
          {
            Put: {
              TableName: 'backup_table',
              Item: {
                name: 'Charlie Davis',
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
                type: 'admin',
                timestamp: 'some_date',
                createdBy: 'admin_ultra',
              },
            },
          },
        ],
      });
    });

    it('should properly call the dynamodb transactionWrite for update', async () => {
      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      const updater = new ItemUpdater({
        dynamoDB: {} as any,
      });

      await writer.executeTransaction([
        {
          update: {
            table: 'some_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
            values: {
              age: 37,
              dob: '1987-11-03',
              address: '202 Pine St, Springfield, IL',
            },
          },
        },
        {
          update: {
            table: 'backup_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
            values: {
              age: 37,
              dob: '1987-11-03',
              address: '202 Pine St, Springfield, IL',
              timestamp: 'some_date',
              createdBy: 'admin_ultra',
            },
          },
        },
      ]);

      expect(transactMock).toHaveBeenCalledTimes(1);
      expect(transactMock).toHaveBeenCalledWith({
        TransactItems: [
          {
            Update: updater.getUpdateParams<any>({
              table: 'some_table',
              key: {
                name: 'Charlie Davis',
                type: 'admin',
              },
              values: {
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
              },
            }),
          },
          {
            Update: updater.getUpdateParams<any>({
              table: 'backup_table',
              key: {
                name: 'Charlie Davis',
                type: 'admin',
              },
              values: {
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
                timestamp: 'some_date',
                createdBy: 'admin_ultra',
              },
            }),
          },
        ],
      });
    });

    it('should properly call the dynamodb transactionWrite for delete', async () => {
      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      await writer.executeTransaction([
        {
          erase: {
            table: 'some_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
          },
        },
        {
          erase: {
            table: 'backup_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
          },
        },
      ]);

      expect(transactMock).toHaveBeenCalledTimes(1);
      expect(transactMock).toHaveBeenCalledWith({
        TransactItems: [
          {
            Delete: {
              TableName: 'some_table',
              Key: {
                name: 'Charlie Davis',
                type: 'admin',
              },
            },
          },
          {
            Delete: {
              TableName: 'backup_table',
              Key: {
                name: 'Charlie Davis',
                type: 'admin',
              },
            },
          },
        ],
      });
    });

    it('should properly call the dynamodb transactionWrite for Condition', async () => {
      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      const conditions = [
        {
          operation: 'bigger_than' as const,
          property: 'count',
          value: 0,
        },
      ];

      await writer.executeTransaction([
        {
          validate: {
            table: 'some_table',
            key: {
              name: 'Charlie Davis',
              type: 'admin',
            },
            conditions,
          },
        },
      ]);

      expect(transactMock).toHaveBeenCalledTimes(1);
      expect(transactMock).toHaveBeenCalledWith({
        TransactItems: [
          {
            ConditionCheck: {
              TableName: 'some_table',

              Key: {
                name: 'Charlie Davis',
                type: 'admin',
              },

              ConditionExpression: buildExpression(conditions),

              ExpressionAttributeNames: getConditionExpressionNames(conditions),

              ExpressionAttributeValues: getConditionExpressionValues(conditions),
            },
          },
        ],
      });
    });

    it('should not call dynamodb if no params in list', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      await writer.executeTransaction([]);

      expect(transactMock).not.toHaveBeenCalled();

      consoleLogMock.mockRestore();
    });

    it('should not call dynamodb if null params in list', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      await writer.executeTransaction([null, null, null]);

      expect(transactMock).not.toHaveBeenCalled();

      consoleLogMock.mockRestore();
    });

    it('should block 100+ items', async () => {
      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      const execute = async () => {
        await writer.executeTransaction(
          Array.from({ length: 101 }, (_, i) => ({
            create: {
              table: 'some_table',
              item: {
                name: `Charlie Davis${i}`,
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
                type: 'admin',
              },
            },
          })),
        );
      };

      await expect(execute()).rejects.toThrow();

      expect(transactMock).not.toHaveBeenCalled();
    });

    it('should handle complex scenarios', async () => {
      const transactMock = jest.fn().mockReturnValue({
        promise: jest.fn(),
      });

      const writer = new TransactionWriter({
        dynamoDB: {
          target: 'v2',
          instance: {
            transactWrite: transactMock,
          } as any,
        },
      });

      const creator = new ItemCreator({ dynamoDB: {} as any });
      const remover = new ItemRemover({ dynamoDB: {} as any });
      const updater = new ItemUpdater({ dynamoDB: {} as any });

      await writer.executeTransaction([
        {
          create: {
            table: 'some_table',
            item: {
              name: 'Charlie Davis',
              age: 37,
              dob: '1987-11-03',
              address: '202 Pine St, Springfield, IL',
              type: 'admin',
              id: '12',
            },
          },
        },
        {
          create: {
            table: 'backup_table',
            item: {
              name: 'Charlie Davis',
              age: 37,
              dob: '1987-11-03',
              address: '202 Pine St, Springfield, IL',
              type: 'admin',
              timestamp: 'some_date',
              createdBy: 'admin_ultra',
            },
          },
        },
        {
          update: {
            table: 'some_table',
            key: {
              id: '14',
            },
            values: {
              name: 'Some name',
            },
            atomicOperations: [
              {
                property: 'count',
                type: 'add',
                value: 1,
              },
            ],
          },
        },
        {
          update: {
            table: 'counts',
            key: {
              pk: 'CONNECTIONS',
            },
            atomicOperations: [
              {
                property: 'users',
                type: 'subtract',
                value: 1,
              },
            ],
            conditions: [
              {
                operation: 'bigger_or_equal_than',
                property: 'users',
                value: 1,
              },
            ],
          },
        },
        {
          validate: {
            table: 'control',
            key: {
              _pk: 'currently_playing',
            },
            conditions: [
              {
                operation: 'between',
                high: 10,
                low: 1,
                property: 'balance',
              },
            ],
          },
        },
        {
          erase: {
            table: 'other',
            key: {
              id: '99',
            },
            conditions: [
              {
                operation: 'exists',
                property: 'deleted',
              },
            ],
          },
        },
      ]);

      expect(transactMock).toHaveBeenCalledTimes(1);
      expect(transactMock).toHaveBeenCalledWith({
        TransactItems: [
          {
            Put: creator.getCreateParams<any>({
              table: 'some_table',
              item: {
                name: 'Charlie Davis',
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
                type: 'admin',
                id: '12',
              },
            }),
          },
          {
            Put: creator.getCreateParams<any>({
              table: 'backup_table',
              item: {
                name: 'Charlie Davis',
                age: 37,
                dob: '1987-11-03',
                address: '202 Pine St, Springfield, IL',
                type: 'admin',
                timestamp: 'some_date',
                createdBy: 'admin_ultra',
              },
            }),
          },
          {
            Update: updater.getUpdateParams<any>({
              table: 'some_table',
              key: {
                id: '14',
              },
              values: {
                name: 'Some name',
              },
              atomicOperations: [
                {
                  property: 'count',
                  type: 'add',
                  value: 1,
                },
              ],
            }),
          },
          {
            Update: updater.getUpdateParams<any>({
              table: 'counts',
              key: {
                pk: 'CONNECTIONS',
              },
              atomicOperations: [
                {
                  property: 'users',
                  type: 'subtract',
                  value: 1,
                },
              ],
              conditions: [
                {
                  operation: 'bigger_or_equal_than',
                  property: 'users',
                  value: 1,
                },
              ],
            }),
          },
          {
            ConditionCheck: {
              TableName: 'control',

              Key: {
                _pk: 'currently_playing',
              },

              ConditionExpression: buildExpression([
                {
                  operation: 'between',
                  high: 10,
                  low: 1,
                  property: 'balance',
                },
              ]),

              ExpressionAttributeNames: getConditionExpressionNames([
                {
                  operation: 'between',
                  high: 10,
                  low: 1,
                  property: 'balance',
                },
              ]),

              ExpressionAttributeValues: getConditionExpressionValues([
                {
                  operation: 'between',
                  high: 10,
                  low: 1,
                  property: 'balance',
                },
              ]),
            },
          },
          {
            Delete: remover.getDeleteParams<any>({
              table: 'other',
              key: {
                id: '99',
              },
              conditions: [
                {
                  operation: 'exists',
                  property: 'deleted',
                },
              ],
            }),
          },
        ],
      });
    });
  });
});
