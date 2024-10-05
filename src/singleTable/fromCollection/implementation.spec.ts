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
  describe('get methods', () => {
    it('should correctly execute and join the most simple example', async () => {
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
        _type: 'USER',

        loginAttempts: [
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
    });
  });
});
