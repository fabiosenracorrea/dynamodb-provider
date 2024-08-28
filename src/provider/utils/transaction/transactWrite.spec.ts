/* eslint-disable @typescript-eslint/no-explicit-any */

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
          transactWrite: transactMock,
        } as any,
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
  });
});
