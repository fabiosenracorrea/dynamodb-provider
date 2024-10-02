/* eslint-disable @typescript-eslint/explicit-function-return-type */
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

    it('should not allow 2 entities with the same type', () => {
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

      const doubleCreation = () => {
        schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER1', id],

          getRangeKey: () => ['#DATA'],
        });

        schema.create<User>().entity({
          type: 'USER',

          getPartitionKey: ({ id }: { id: string }) => ['USER2', id],

          getRangeKey: () => ['#DATA'],
        });
      };

      expect(doubleCreation).toThrow();
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

    describe('creation params', () => {
      it('should accept expiresAt if table config allows it', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

          expiresAt: '_expires',
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

        const createParams = user.getCreationParams(
          {
            id: 'id',
            address: 'address',
            createdAt: 'now',
            dob: '1970',
            email: 'test@email.com',
            name: 'User',
          },
          {
            expiresAt: 2032043,
          },
        );

        expect(createParams.expiresAt).toEqual(2032043);
      });

      it('should properly build index mapping', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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

        const createParams = user.getCreationParams(
          {
            id: 'id',
            address: 'address',
            createdAt: 'now',
            dob: '1970',
            email: 'test@EMAIL.com',
            name: 'User',
          },
          {
            expiresAt: 2032043,
          },
        );

        expect(createParams.expiresAt).toEqual(2032043);
        expect(createParams.indexes).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['test@email.com'],
          },
        });
      });

      it('should fully build params', () => {
        const schema = new SingleTableSchema({
          partitionKey: 'hello',
          rangeKey: 'key',

          table: 'my-table',

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

        const createParams = user.getCreationParams(
          {
            id: 'id',
            address: 'address',
            createdAt: 'now',
            dob: '1970',
            email: 'test@EMAIL.com',
            name: 'User',
          },
          {
            expiresAt: 2032043,
          },
        );

        expect(createParams.expiresAt).toEqual(2032043);
        expect(createParams.indexes).toStrictEqual({
          anotherIndex: {
            partitionKey: ['USERS_BY_EMAIL'],
            rangeKey: ['test@email.com'],
          },
        });
        expect(createParams.item).toStrictEqual({
          id: 'id',
          address: 'address',
          createdAt: 'now',
          dob: '1970',
          email: 'test@EMAIL.com',
          name: 'User',
        });
      });
    });

    describe('update params', () => {
      it('should properly build key reference', () => {
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

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
        });
      });

      it('should handle expiresAt', () => {
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

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,
        });
      });

      it('should handle indexes', () => {
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

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,

          indexes: {
            anotherIndex: {
              partitionKey: ['USERS_BY_EMAIL'],
              rangeKey: ['new@email.com'],
            },
          },
        });
      });

      it('should simply forward atomicOperations, conditions, remove and returnUpdatedProperties values', () => {
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

        const forwardValues = {
          atomicOperations: Symbol('atomicOperations'),
          conditions: Symbol('conditions'),
          remove: Symbol('remove'),
          returnUpdatedProperties: Symbol('returnUpdatedProperties'),
        } as any;

        const params = user.getUpdateParams({
          id: 'user-id',

          values: {
            email: 'new@email.com',
          },

          expiresAt: 20323492,

          ...forwardValues,
        });

        expect(params).toStrictEqual({
          partitionKey: ['USER', 'user-id'],
          rangeKey: ['#DATA'],
          values: {
            email: 'new@email.com',
          },
          expiresAt: 20323492,

          indexes: {
            anotherIndex: {
              partitionKey: ['USERS_BY_EMAIL'],
              rangeKey: ['new@email.com'],
            },
          },

          ...forwardValues,
        });
      });
    });
  });

  describe('partition tests', () => {
    describe('entity partition tests', () => {
      it('should not allow 2 usages of the same entry', () => {
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

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const doubleUsage = () => {
          partition.use('data');

          partition.use('data');
        };

        expect(doubleUsage).toThrow();
      });

      it('should not contain "index" method', () => {
        const schema = new SingleTableSchema({
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

        const creator = partition.use('data').create<{ some: string }>();

        expect('index' in creator).toBe(false);
      });

      it('should throw on bad entry reference', () => {
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

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const badRef = () => {
          partition.use('dataa' as any);
        };

        expect(badRef).toThrow();
      });

      it('should properly build entity from entry', () => {
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

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        expect(partition.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = partition.use('data').create<User>().entity({
          type: 'USER',
        });

        expect(user.__dbType).toBe('ENTITY');
        expect(user.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);
        expect(user.getRangeKey()).toStrictEqual(['#DATA']);
        expect(user.getKey({ userId: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should properly build entity with param-match', () => {
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

        const partition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        expect(partition.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        type User = {
          name: string;
          id: string;
          email: string;
          address: string;
          dob: string;
          createdAt: string;
          updatedAt?: string;
        };

        const user = partition
          .use('data')
          .create<User>()
          .entity({
            type: 'USER',

            paramMatch: {
              userId: 'id',
            },
          });

        expect(user.__dbType).toBe('ENTITY');

        expect(user.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

        expect(user.getRangeKey()).toStrictEqual(['#DATA']);

        expect(user.getKey({ id: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });
    });

    describe('index partition tests', () => {
      it('should not allow 2 usages of the same entry', () => {
        const schema = new SingleTableSchema({
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
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          index: 'anotherIndex',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const doubleUsage = () => {
          partition.use('data');

          partition.use('data');
        };

        expect(doubleUsage).toThrow();
      });

      it('should not contain "entity" method', () => {
        const schema = new SingleTableSchema({
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
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          index: 'anotherIndex',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const creator = partition.use('data').create<any>();

        expect('entity' in creator).toBe(false);
      });

      it('should throw on bad entry reference', () => {
        const schema = new SingleTableSchema({
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
        });

        const partition = schema.createPartition({
          name: 'USER_PARTITION',
          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
          index: 'anotherIndex',
          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
          },
        });

        const badRef = () => {
          partition.use('dataa' as any);
        };

        expect(badRef).toThrow();
      });

      it('should properly build a standard index', () => {
        const schema = new SingleTableSchema({
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
        });

        const indexPartition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          index: 'anotherIndex',

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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

        const index = indexPartition.use('data').create<User>().index();

        expect(index.index).toBe('anotherIndex');

        expect(index.getPartitionKey({ userId: 'idd' })).toStrictEqual(['USER', 'idd']);

        expect(index.getRangeKey()).toStrictEqual(['#DATA']);

        expect(index.getKey({ userId: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should build a standard index with param match', () => {
        const schema = new SingleTableSchema({
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
        });

        const indexPartition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          index: 'anotherIndex',

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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

        const index = indexPartition
          .use('data')
          .create<User>()
          .index({
            paramMatch: {
              userId: 'id',
            },
          });

        expect(index.index).toBe('anotherIndex');

        expect(index.getPartitionKey({ id: 'idd' })).toStrictEqual(['USER', 'idd']);

        expect(index.getRangeKey()).toStrictEqual(['#DATA']);

        expect(index.getKey({ id: 'idd' })).toStrictEqual({
          partitionKey: ['USER', 'idd'],
          rangeKey: ['#DATA'],
        });
      });

      it('should allow range queries to be forwarded', () => {
        const schema = new SingleTableSchema({
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
        });

        const indexPartition = schema.createPartition({
          name: 'USER_PARTITION',

          getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

          index: 'anotherIndex',

          entries: {
            data: () => [`#DATA`],
            permissions: () => [`#PERMISSIONS`],
            loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
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

        const rangeQueries = {
          userData: {
            operation: 'begins_with' as const,
            getValues: () => ({
              value: '#DATA',
            }),
          },

          someBetweenQuery: {
            operation: 'between' as const,
            getValues: ({ start, end }: { start: string; end: string }) => ({
              low: start,
              high: end,
            }),
          },
        };

        const index = indexPartition.use('data').create<User>().index({
          rangeQueries,
        });

        expect(index.rangeQueries).toEqual(rangeQueries);
      });
    });
  });
});
