import { Equal, Expect, FirstParameter } from 'types';
import { SingleTableSchema } from '../../schema';

import { tableConfig, User } from './helpers.test';

const baseEntityParams = {
  type: 'USER',

  getPartitionKey: ({ id }: { id: string }) => ['USER', id],

  getRangeKey: () => ['#DATA'],
};

describe('single table schema - entity - update params', () => {
  it('should properly build key reference', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as(baseEntityParams);

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
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as(baseEntityParams);

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
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

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
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      ...baseEntityParams,

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it('[TYPES] Properly accept referenced to Entity', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as(baseEntityParams);

    type Params = FirstParameter<typeof user.getUpdateParams>;

    user.getUpdateParams({
      id: '1',

      // @ts-expect-error no bad references
      remove: ['bad_prop'],

      atomicOperations: [
        {
          // @ts-expect-error no bad references
          property: 'bad+prop',
          type: 'add',
          value: 1,
        },
      ],

      conditions: [
        {
          // @ts-expect-error no bad references
          property: 'another!bad!',
          operation: 'begins_with',
          value: '1',
        },
      ],
    });

    type _Tests = [
      Expect<Equal<Params['expiresAt'], number | undefined>>,

      Expect<Equal<Params['values'], Partial<User> | undefined>>,

      Expect<Equal<NonNullable<Params['remove']>, (keyof User)[]>>,

      Expect<
        Equal<NonNullable<Params['atomicOperations']>[number]['property'], keyof User>
      >,

      Expect<Equal<NonNullable<Params['conditions']>[number]['property'], keyof User>>,
    ];
  });
});
