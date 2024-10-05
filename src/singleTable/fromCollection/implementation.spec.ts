/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableSchema } from '../model';
import { SingleTableFromCollection } from './implementation';

type User = {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
};

type UserLoginAttempt = {
  userId: string;
  timestamp: string;
  device: string;
  success: boolean;
};

describe('single table - from collection tests', () => {
  describe('get method', () => {
    describe('simple tests', () => {
      const params = {
        partitionKey: 'hashKey',
        rangeKey: 'RKey',

        table: 'my-table',

        typeIndex: {
          partitionKey: '_type',
          rangeKey: 'key',
          name: 'fake-index',
        },

        indexes: {
          someIndex: {
            partitionKey: '_indexHash1',
            rangeKey: '_indexRange1',
          },

          anotherIndex: {
            partitionKey: '_indexHash2',
            rangeKey: '_indexRange2',
          },

          yetAnotherIndex: {
            partitionKey: '_indexHash3',
            rangeKey: '_indexRange3',
          },
        },
      };

      const schema = new SingleTableSchema(params);

      const partition = schema.createPartition({
        name: 'USER_PARTITION',
        getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
        entries: {
          data: () => [`#DATA`],
          permissions: () => [`#PERMISSIONS`],
          loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
        },
      });

      const user = partition
        .use('data')
        .create<User>()
        .entity({
          type: 'USER',

          paramMatch: { userId: 'id' },
        });

      const loginAttempts = partition.use('loginAttempts').create<UserLoginAttempt>().entity({
        type: 'USER_LOGIN_ATTEMPT',
      });

      it('should correctly execute and join the most simple example', async () => {
        const queryMock = jest.fn().mockResolvedValue({
          items: [
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',
              _type: 'USER',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T13:30:00Z',
              device: 'Chrome on Windows',
              success: true,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:00:00Z',
              device: 'Safari on iPhone',
              success: false,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:30:00Z',
              device: 'Firefox on Linux',
              success: true,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:45:00Z',
              device: 'Edge on Windows',
              success: false,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T15:00:00Z',
              device: 'Chrome on macOS',
              success: true,
              _type: 'USER_LOGIN_ATTEMPT',
            },
          ],
        });

        const instance = new SingleTableFromCollection({
          ...params,

          dynamodbProvider: {
            query: queryMock,
          } as any,
        });

        const collection = schema.createCollection({
          partition,

          type: 'SINGLE',

          ref: user,

          join: {
            loginAttempts: {
              entity: loginAttempts,

              type: 'MULTIPLE',
            },
          },
        });

        const result = await instance.fromCollection(collection).get({
          userId: 'hello',
        });

        expect(queryMock).toHaveBeenCalledWith({
          partitionKey: {
            name: params.partitionKey,
            value: 'USER#hello',
          },

          fullRetrieval: true,

          table: params.table,

          // TODO: remove later
          userId: 'hello',
        });

        expect(result).toStrictEqual({
          name: 'John Doe',
          id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
          email: 'johndoe@example.com',
          address: '123 Main St, Springfield, IL',
          dob: '1990-06-15',
          createdAt: '2024-10-04T13:00:00Z',
          updatedAt: '2024-10-04T15:00:00Z',

          loginAttempts: [
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T13:30:00Z',
              device: 'Chrome on Windows',
              success: true,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:00:00Z',
              device: 'Safari on iPhone',
              success: false,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:30:00Z',
              device: 'Firefox on Linux',
              success: true,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:45:00Z',
              device: 'Edge on Windows',
              success: false,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T15:00:00Z',
              device: 'Chrome on macOS',
              success: true,
            },
          ],
        });
      });

      it('should build a collection with no root ref', async () => {
        const queryMock = jest.fn().mockResolvedValue({
          items: [
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',
              _type: 'USER',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T13:30:00Z',
              device: 'Chrome on Windows',
              success: true,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:00:00Z',
              device: 'Safari on iPhone',
              success: false,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:30:00Z',
              device: 'Firefox on Linux',
              success: true,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:45:00Z',
              device: 'Edge on Windows',
              success: false,
              _type: 'USER_LOGIN_ATTEMPT',
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T15:00:00Z',
              device: 'Chrome on macOS',
              success: true,
              _type: 'USER_LOGIN_ATTEMPT',
            },
          ],
        });

        const instance = new SingleTableFromCollection({
          ...params,

          dynamodbProvider: {
            query: queryMock,
          } as any,
        });

        const collection = schema.createCollection({
          partition,

          type: 'SINGLE',

          ref: null,

          join: {
            loginAttempts: {
              entity: loginAttempts,

              type: 'MULTIPLE',
            },

            user: {
              entity: user,

              type: 'SINGLE',
            },
          },
        });

        const result = await instance.fromCollection(collection).get({
          userId: 'hello',
        });

        expect(queryMock).toHaveBeenCalledWith({
          partitionKey: {
            name: params.partitionKey,
            value: 'USER#hello',
          },

          fullRetrieval: true,

          table: params.table,

          // TODO: remove later
          userId: 'hello',
        });

        expect(result).toStrictEqual({
          user: {
            name: 'John Doe',
            id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
            email: 'johndoe@example.com',
            address: '123 Main St, Springfield, IL',
            dob: '1990-06-15',
            createdAt: '2024-10-04T13:00:00Z',
            updatedAt: '2024-10-04T15:00:00Z',
          },

          loginAttempts: [
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T13:30:00Z',
              device: 'Chrome on Windows',
              success: true,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:00:00Z',
              device: 'Safari on iPhone',
              success: false,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:30:00Z',
              device: 'Firefox on Linux',
              success: true,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T14:45:00Z',
              device: 'Edge on Windows',
              success: false,
            },
            {
              userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              timestamp: '2024-10-04T15:00:00Z',
              device: 'Chrome on macOS',
              success: true,
            },
          ],
        });
      });

      describe('narrowBy', () => {
        it("narrowBy RANGE_KEY should properly query with entity's range restriction and no range key param from getRangeKey", async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
                _type: 'USER',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'SINGLE',

            ref: user,

            narrowBy: `RANGE_KEY`,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(queryMock).toHaveBeenCalledWith({
            partitionKey: {
              name: params.partitionKey,
              value: 'USER#hello',
            },

            rangeKey: {
              name: params.rangeKey,
              value: '#DATA',
              operation: 'begins_with',
            },

            fullRetrieval: true,

            table: params.table,

            // TODO: remove later
            userId: 'hello',
          });

          expect(result).toStrictEqual({
            name: 'John Doe',
            id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
            email: 'johndoe@example.com',
            address: '123 Main St, Springfield, IL',
            dob: '1990-06-15',
            createdAt: '2024-10-04T13:00:00Z',
            updatedAt: '2024-10-04T15:00:00Z',

            loginAttempts: [
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
              },
            ],
          });
        });

        it("narrowBy RANGE_KEY should properly query with entity's range restriction and range key param from getRangeKey", async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
                _type: 'USER1',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const userRef = schema.create<User>().entity({
            type: 'USER1',

            getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

            getRangeKey: ({ name }: { name: string }) => ['SOME_RANGE_KEY', name],
          });

          const collection = schema.createCollection({
            partition,

            type: 'SINGLE',

            ref: userRef,

            narrowBy: `RANGE_KEY`,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
            name: 'some-name',
          });

          expect(queryMock).toHaveBeenCalledWith({
            partitionKey: {
              name: params.partitionKey,
              value: 'USER#hello',
            },

            rangeKey: {
              name: params.rangeKey,
              value: 'SOME_RANGE_KEY#some-name',
              operation: 'begins_with',
            },

            fullRetrieval: true,

            table: params.table,

            // TODO: remove later
            userId: 'hello',
            name: 'some-name',
          });

          expect(result).toStrictEqual({
            name: 'John Doe',
            id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
            email: 'johndoe@example.com',
            address: '123 Main St, Springfield, IL',
            dob: '1990-06-15',
            createdAt: '2024-10-04T13:00:00Z',
            updatedAt: '2024-10-04T15:00:00Z',

            loginAttempts: [
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
              },
            ],
          });
        });

        it("narrowBy GETTER should properly query with entity's range restriction", async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
                _type: 'USER',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'SINGLE',

            ref: user,

            narrowBy: ({ customParam }: { customParam: string }) => ({
              operation: 'begins_with',
              value: customParam,
            }),

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
            customParam: 'custom!',
          });

          expect(queryMock).toHaveBeenCalledWith({
            partitionKey: {
              name: params.partitionKey,
              value: 'USER#hello',
            },

            rangeKey: {
              name: params.rangeKey,
              value: 'custom!',
              operation: 'begins_with',
            },

            fullRetrieval: true,

            table: params.table,

            // TODO: remove later
            userId: 'hello',
            customParam: 'custom!',
          });

          expect(result).toStrictEqual({
            name: 'John Doe',
            id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
            email: 'johndoe@example.com',
            address: '123 Main St, Springfield, IL',
            dob: '1990-06-15',
            createdAt: '2024-10-04T13:00:00Z',
            updatedAt: '2024-10-04T15:00:00Z',

            loginAttempts: [
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
              },
            ],
          });
        });
      });

      describe('joins', () => {
        it('should retrieve and join a multi return by POSITION by default (required sk/pk to be present)', async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T13:30:00Z',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:00:00Z',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:30:00Z',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:45:00Z',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T15:00:00Z',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },

              // other user
              {
                name: 'Other user',
                id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'other@example.com',
                address: '123 Main St, mno!, IL',
                dob: '1980-01-15',
                createdAt: '2023-10-04T13:00:00Z',
                updatedAt: '2023-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T14:45:00Z',
                timestamp: '2024-10-05T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T15:00:00Z',
                timestamp: '2024-10-05T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'MULTIPLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(result).toStrictEqual([
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T13:30:00Z',
                  device: 'Chrome on Windows',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:00:00Z',
                  device: 'Safari on iPhone',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:30:00Z',
                  device: 'Firefox on Linux',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
              ],
            },

            {
              name: 'Other user',
              id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
              email: 'other@example.com',
              address: '123 Main St, mno!, IL',
              dob: '1980-01-15',
              createdAt: '2023-10-04T13:00:00Z',
              updatedAt: '2023-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
              ],
            },
          ]);
        });

        it('should retrieve and join a multi return by TYPE if specified', async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T13:30:00Z',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:00:00Z',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:30:00Z',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:45:00Z',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T15:00:00Z',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },

              // other user
              {
                name: 'Other user',
                id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'other@example.com',
                address: '123 Main St, mno!, IL',
                dob: '1980-01-15',
                createdAt: '2023-10-04T13:00:00Z',
                updatedAt: '2023-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T14:45:00Z',
                timestamp: '2024-10-05T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T15:00:00Z',
                timestamp: '2024-10-05T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'MULTIPLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',

                joinBy: 'TYPE',
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          // This would be a design flaw in the real world, but its
          // absolutely the correct execution of the method
          expect(result).toStrictEqual([
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T13:30:00Z',
                  device: 'Chrome on Windows',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:00:00Z',
                  device: 'Safari on iPhone',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:30:00Z',
                  device: 'Firefox on Linux',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
              ],
            },

            {
              name: 'Other user',
              id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
              email: 'other@example.com',
              address: '123 Main St, mno!, IL',
              dob: '1980-01-15',
              createdAt: '2023-10-04T13:00:00Z',
              updatedAt: '2023-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T13:30:00Z',
                  device: 'Chrome on Windows',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:00:00Z',
                  device: 'Safari on iPhone',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:30:00Z',
                  device: 'Firefox on Linux',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
              ],
            },
          ]);
        });

        it('should join with a resolver', async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T13:30:00Z',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:00:00Z',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:30:00Z',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:45:00Z',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T15:00:00Z',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },

              // other user
              {
                name: 'Other user',
                id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'other@example.com',
                address: '123 Main St, mno!, IL',
                dob: '1980-01-15',
                createdAt: '2023-10-04T13:00:00Z',
                updatedAt: '2023-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T14:45:00Z',
                timestamp: '2024-10-05T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T15:00:00Z',
                timestamp: '2024-10-05T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'MULTIPLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',

                joinBy: (parent, child) => child.success && parent.id === child.userId,
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          // This would be a design flaw in the real world, but its
          // absolutely the correct execution of the joinBy
          expect(result).toStrictEqual([
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T13:30:00Z',
                  device: 'Chrome on Windows',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:30:00Z',
                  device: 'Firefox on Linux',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
              ],
            },

            {
              name: 'Other user',
              id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
              email: 'other@example.com',
              address: '123 Main St, mno!, IL',
              dob: '1980-01-15',
              createdAt: '2023-10-04T13:00:00Z',
              updatedAt: '2023-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
              ],
            },
          ]);
        });
      });

      describe('index relations', () => {
        it('should correctly forward its index', async () => {
          const queryMock = jest.fn().mockResolvedValue({ items: [] });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            getPartitionKey: partition.getPartitionKey,

            index: 'anotherIndex',

            type: 'SINGLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',
              },
            },
          });

          await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(queryMock).toHaveBeenCalledWith({
            partitionKey: {
              name: params.indexes.anotherIndex.partitionKey,
              value: 'USER#hello',
            },

            index: 'anotherIndex',

            fullRetrieval: true,

            table: params.table,

            // TODO: remove later
            userId: 'hello',
          });
        });

        it('should correctly use partition index, if applicable', async () => {
          const queryMock = jest.fn().mockResolvedValue({ items: [] });

          const indexPartition = schema.createPartition({
            name: 'USER_PARTITION',
            getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
            index: 'someIndex',
            entries: {
              data: () => [`#DATA`],
              permissions: () => [`#PERMISSIONS`],
              loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
            },
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition: indexPartition,

            type: 'SINGLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',
              },
            },
          });

          await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(queryMock).toHaveBeenCalledWith({
            partitionKey: {
              name: params.indexes.someIndex.partitionKey,
              value: 'USER#hello',
            },

            index: 'someIndex',

            fullRetrieval: true,

            table: params.table,

            // TODO: remove later
            userId: 'hello',
          });
        });
      });

      describe('sorter', () => {
        it('should properly sort inner joined prop', async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T13:30:00Z',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:00:00Z',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:30:00Z',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:45:00Z',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T15:00:00Z',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },

              // other user
              {
                name: 'Other user',
                id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'other@example.com',
                address: '123 Main St, mno!, IL',
                dob: '1980-01-15',
                createdAt: '2023-10-04T13:00:00Z',
                updatedAt: '2023-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T14:45:00Z',
                timestamp: '2024-10-05T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T15:00:00Z',
                timestamp: '2024-10-05T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'MULTIPLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',

                sorter: (a, b) => Number(b.success) - Number(a.success),
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(result).toStrictEqual([
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T13:30:00Z',
                  device: 'Chrome on Windows',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:30:00Z',
                  device: 'Firefox on Linux',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:00:00Z',
                  device: 'Safari on iPhone',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
              ],
            },

            {
              name: 'Other user',
              id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
              email: 'other@example.com',
              address: '123 Main St, mno!, IL',
              dob: '1980-01-15',
              createdAt: '2023-10-04T13:00:00Z',
              updatedAt: '2023-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
              ],
            },
          ]);
        });

        it('should properly sort root entity list', async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T13:30:00Z',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:00:00Z',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:30:00Z',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:45:00Z',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T15:00:00Z',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },

              // other user
              {
                name: 'another user',
                id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'other@example.com',
                address: '123 Main St, mno!, IL',
                dob: '1980-01-15',
                createdAt: '2023-10-04T13:00:00Z',
                updatedAt: '2023-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T14:45:00Z',
                timestamp: '2024-10-05T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T15:00:00Z',
                timestamp: '2024-10-05T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'MULTIPLE',

            ref: user,

            sorter: (a, b) => a.name.localeCompare(b.name),

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',

                sorter: (a, b) => Number(b.success) - Number(a.success),
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(result).toStrictEqual([
            {
              name: 'another user',
              id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
              email: 'other@example.com',
              address: '123 Main St, mno!, IL',
              dob: '1980-01-15',
              createdAt: '2023-10-04T13:00:00Z',
              updatedAt: '2023-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-05T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
              ],
            },

            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',

              loginAttempts: [
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T13:30:00Z',
                  device: 'Chrome on Windows',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:30:00Z',
                  device: 'Firefox on Linux',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T15:00:00Z',
                  device: 'Chrome on macOS',
                  success: true,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:00:00Z',
                  device: 'Safari on iPhone',
                  success: false,
                },
                {
                  userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                  timestamp: '2024-10-04T14:45:00Z',
                  device: 'Edge on Windows',
                  success: false,
                },
              ],
            },
          ]);
        });
      });

      describe('extractor', () => {
        it('should properly return collection with join parsed', async () => {
          const queryMock = jest.fn().mockResolvedValue({
            items: [
              {
                name: 'John Doe',
                id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'johndoe@example.com',
                address: '123 Main St, Springfield, IL',
                dob: '1990-06-15',
                createdAt: '2024-10-04T13:00:00Z',
                updatedAt: '2024-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T13:30:00Z',
                timestamp: '2024-10-04T13:30:00Z',
                device: 'Chrome on Windows',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:00:00Z',
                timestamp: '2024-10-04T14:00:00Z',
                device: 'Safari on iPhone',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:30:00Z',
                timestamp: '2024-10-04T14:30:00Z',
                device: 'Firefox on Linux',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T14:45:00Z',
                timestamp: '2024-10-04T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-04T15:00:00Z',
                timestamp: '2024-10-04T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },

              // other user
              {
                name: 'Other user',
                id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '#DATA',
                _type: 'USER',
                email: 'other@example.com',
                address: '123 Main St, mno!, IL',
                dob: '1980-01-15',
                createdAt: '2023-10-04T13:00:00Z',
                updatedAt: '2023-10-04T15:00:00Z',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T14:45:00Z',
                timestamp: '2024-10-05T14:45:00Z',
                device: 'Edge on Windows',
                success: false,
                _type: 'USER_LOGIN_ATTEMPT',
              },
              {
                userId: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.partitionKey]: 'USER#f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
                [params.rangeKey]: '2024-10-05T15:00:00Z',
                timestamp: '2024-10-05T15:00:00Z',
                device: 'Chrome on macOS',
                success: true,
                _type: 'USER_LOGIN_ATTEMPT',
              },
            ],
          });

          const instance = new SingleTableFromCollection({
            ...params,

            dynamodbProvider: {
              query: queryMock,
            } as any,
          });

          const collection = schema.createCollection({
            partition,

            type: 'MULTIPLE',

            ref: user,

            join: {
              loginAttempts: {
                entity: loginAttempts,

                type: 'MULTIPLE',

                extractor: ({ timestamp }) => timestamp,
              },
            },
          });

          const result = await instance.fromCollection(collection).get({
            userId: 'hello',
          });

          expect(result).toStrictEqual([
            {
              name: 'John Doe',
              id: 'f7b9a8d0-e159-4679-a7d7-5f1be26c3a71',
              email: 'johndoe@example.com',
              address: '123 Main St, Springfield, IL',
              dob: '1990-06-15',
              createdAt: '2024-10-04T13:00:00Z',
              updatedAt: '2024-10-04T15:00:00Z',

              loginAttempts: [
                '2024-10-04T13:30:00Z',

                '2024-10-04T14:00:00Z',

                '2024-10-04T14:30:00Z',

                '2024-10-04T14:45:00Z',

                '2024-10-04T15:00:00Z',
              ],
            },

            {
              name: 'Other user',
              id: 'f7b9a8d0-239023-4679-a7d7-5f1be26c3a71',
              email: 'other@example.com',
              address: '123 Main St, mno!, IL',
              dob: '1980-01-15',
              createdAt: '2023-10-04T13:00:00Z',
              updatedAt: '2023-10-04T15:00:00Z',

              loginAttempts: ['2024-10-05T14:45:00Z', '2024-10-05T15:00:00Z'],
            },
          ]);
        });
      });
    });
  });
});
