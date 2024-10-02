/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid';
import { SingleTableSchema } from './schema';

jest.mock('uuid');

describe('single table schema tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('create entity tests', () => {
    it('should create a simple entity', () => {
      const schema = new SingleTableSchema({
        partitionKey: 'hello',
        rangeKey: 'key',

        table: 'my-table',

        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },

        expiresAt: '_expires',

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
      });

      type User = {
        name: string;
        id: string;
        email: string;
        address: string;
        dob: string;
        createdAt: string;
        updatedAt?: string;
      };

      const user = schema.create<User>().entity({
        type: 'USER',

        getPartitionKey: ({ id }: { id: string }) => ['USER', id],

        getRangeKey: () => ['#DATA'],
      });

      expect(user.__dbType).toBe('ENTITY');
      expect(user.type).toBe('USER');

      expect(user.getPartitionKey({ id: 'id' })).toStrictEqual(['USER', 'id']);
      expect(user.getRangeKey()).toStrictEqual(['#DATA']);

      expect(
        user.getKey({
          id: 'my-id',
        }),
      ).toStrictEqual({
        partitionKey: ['USER', 'my-id'],
        rangeKey: ['#DATA'],
      });
    });

    describe('entity type', () => {
      it('creation: should add the type property if type-index present', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

        const params = user.getCreationParams({
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        });

        expect(params.type).toBe('USER');

        expect(params.item).toStrictEqual({
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        });
      });

      it('creation: should not add the type property if type-index not present', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],
        });

        const params = user.getCreationParams({
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        });

        expect((params as any).type).toBe(undefined);

        expect(params.item).toStrictEqual({
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        });
      });
    });

    describe('auto-gen', () => {
      it('creation: should auto-gen specified fields', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
          hash: string;
        };

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));
        (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          autoGen: {
            onCreate: {
              id: 'UUID',
              createdAt: 'timestamp',
              hash: () => 'my-hash',
            },
          },
        });

        const params = user.getCreationParams({
          address: 'address',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',
        });

        expect(params.item).toStrictEqual({
          address: 'address',
          dob: '1970',
          email: 'test@email.com',
          name: 'User',

          createdAt: mockTimestamp,
          id: 'mocked-uuid',
          hash: 'my-hash',
        });

        jest.useRealTimers();
      });

      it('update: should auto-gen specified fields', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
          hash: string;
        };

        const mockTimestamp = '2024-01-01T00:00:00.000Z';

        jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          autoGen: {
            onUpdate: {
              updatedAt: 'timestamp',
            },
          },
        });

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },
        });

        expect(params.values).toStrictEqual({
          email: 'new@email.com',
          updatedAt: mockTimestamp,
        });

        jest.useRealTimers();
      });
    });

    describe('range-queries', () => {
      it('should handle a non-param query', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            userData: {
              operation: 'begins_with',
              getValues: () => ({
                value: '#DATA',
              }),
            },
          },
        });

        expect(user.rangeQueries.userData()).toStrictEqual({
          operation: 'begins_with',
          value: '#DATA',
        });
      });

      it('should handle a param query', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          rangeQueries: {
            someBetweenQuery: {
              operation: 'between',
              getValues: ({ start, end }: { start: string; end: string }) => ({
                low: start,
                high: end,
              }),
            },
          },
        });

        expect(
          user.rangeQueries.someBetweenQuery({
            start: 'a',
            end: 'z',
          }),
        ).toStrictEqual({
          operation: 'between',
          low: 'a',
          high: 'z',
        });
      });
    });

    describe('indexes', () => {
      it('should properly handle index base props', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },
          },
        });

        expect(user.indexes.BY_EMAIL.index).toBe('anotherIndex');
        expect(user.indexes.BY_EMAIL.getPartitionKey()).toStrictEqual(['USERS_BY_EMAIL']);
        expect(user.indexes.BY_EMAIL.getRangeKey({ email: 'email@EMAIL.com' })).toStrictEqual([
          'email@email.com',
        ]);

        expect(
          user.indexes.BY_EMAIL.getKey({
            email: 'email@EMAIL.com',
          }),
        ).toStrictEqual({
          partitionKey: ['USERS_BY_EMAIL'],
          rangeKey: ['email@email.com'],
        });
      });

      it('should properly generate getCreationIndexMapping', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getCreationIndexMapping({
          email: 'some@email.com',
          name: 'Username',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
            rangeKey: ['_name', 'username'],
          },
        });
      });

      it('getCreationIndexMapping should allow incomplete references', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getCreationIndexMapping({
          email: 'some@email.com',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
          },
        });
      });

      it('should properly generate getUpdatedIndexMapping', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getUpdatedIndexMapping({
          email: 'some@email.com',
          name: 'Username',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
            rangeKey: ['_name', 'username'],
          },
        });
      });

      it('getUpdatedIndexMapping should allow incomplete references', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
            },

            BY_NAME: {
              getPartitionKey: () => ['USERS_BY_NAME'],
              getRangeKey: ({ name }: { name: string }) => ['_name', name?.toLocaleLowerCase()],
              index: 'someIndex',
            },
          },
        });

        const indexMapping = user.getUpdatedIndexMapping({
          email: 'some@email.com',
        });

        expect(indexMapping).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['some@email.com'],
          },

          someIndex: {
            partitionKey: ['USERS_BY_NAME'],
          },
        });
      });

      it('range queries: should handle NO param queries', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
              rangeQueries: {
                aEmails: {
                  operation: 'begins_with',
                  getValues: () => ({
                    value: 'a',
                  }),
                },
              },
            },
          },
        });

        expect(user.indexes.BY_EMAIL.rangeQueries.aEmails()).toStrictEqual({
          operation: 'begins_with',
          value: `a`,
        });
      });

      it('range queries: should handle param queries', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },

          expiresAt: '_expires',

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
        });

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER', id],

          getRangeKey: () => ['#DATA'],

          indexes: {
            BY_EMAIL: {
              getPartitionKey: () => ['USERS_BY_EMAIL'],
              getRangeKey: ({ email }: { email: string }) => [email?.toLocaleLowerCase()],
              index: 'anotherIndex',
              rangeQueries: {
                prefix: {
                  operation: 'begins_with',
                  getValues: ({ emailStart }: { emailStart: string }) => ({
                    value: emailStart,
                  }),
                },
              },
            },
          },
        });

        expect(
          user.indexes.BY_EMAIL.rangeQueries.prefix({
            emailStart: 'fab',
          }),
        ).toStrictEqual({
          operation: 'begins_with',
          value: `fab`,
        });
      });
    });
  });
});
