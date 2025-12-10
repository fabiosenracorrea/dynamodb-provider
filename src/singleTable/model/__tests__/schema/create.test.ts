/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect, FirstParameter, RequiredKeys } from 'types';

import { SingleTableSchema } from '../../schema';

import { tableConfig, User } from './helpers.test';

const baseEntityParams = {
  type: 'USER',

  getPartitionKey: ({ id }: { id: string }) => ['USER', id],

  getRangeKey: () => ['#DATA'],
};

describe('single table schema - entity - creation params', () => {
  it('should accept expiresAt if table config allows it', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as(baseEntityParams);

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

    const createItems = {
      id: 'id',
      address: 'address',
      createdAt: 'now',
      dob: '1970',
      email: 'test@EMAIL.com',
      name: 'User',
    };

    const createParams = user.getCreationParams(createItems, {
      expiresAt: 2032043,
    });

    expect(createParams.item).toStrictEqual(createItems);

    expect(createParams.expiresAt).toEqual(2032043);
    expect(createParams.indexes).toStrictEqual({
      anotherIndex: {
        partitionKey: ['USERS_BY_EMAIL'],
        rangeKey: ['test@email.com'],
      },
    });
  });

  it('should fully build params', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
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
