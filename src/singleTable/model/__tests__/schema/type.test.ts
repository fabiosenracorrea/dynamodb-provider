/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableSchema } from '../../schema';

import { tableConfig, User } from './helpers.test';

describe('single table schema - entity - type', () => {
  it('[creation]: should add the type property if type-index present', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],
    });

    const createParams = {
      id: 'id',
      address: 'address',
      createdAt: 'now',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
    };

    const params = user.getCreationParams(createParams);

    expect(params.type).toBe('USER');

    expect(params.item).toStrictEqual(createParams);
  });

  it('[creation]: should not add the type property if type-index not present', () => {
    const schema = new SingleTableSchema({
      dynamodbProvider: {} as any,
      partitionKey: 'hello',
      rangeKey: 'key',
      table: 'my-table',
    });

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: () => ['#DATA'],
    });

    const createAs = {
      id: 'id',
      address: 'address',
      createdAt: 'now',
      dob: '1970',
      email: 'test@email.com',
      name: 'User',
    };

    const params = user.getCreationParams(createAs);

    expect((params as any).type).toBe(undefined);

    expect(params.item).toStrictEqual(createAs);
  });
});
