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
    it('should correctly execute and join the most simple example', () => {
      const params = {
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',

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

      const instance = new SingleTableFromCollection({
        ...params,

        dynamodbProvider: {} as any,
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
    });
  });
});
