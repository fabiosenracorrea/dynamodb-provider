/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BatchCreateResult, BatchDeleteResult, BatchMutateResult } from 'provider';
import type { Equal, Expect, PrettifyObject } from 'types';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { paramsFor, User } from './helpers.test';

type BatchWriteMethod = 'batchCreate' | 'batchDelete' | 'batchMutate';

function createUser(id: string): User {
  return {
    name: `User ${id}`,
    id,
    email: `${id}@example.com`,
    address: `Address ${id}`,
    dob: '1990-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function setup(method: BatchWriteMethod, returnValue: any) {
  const params = paramsFor(method, returnValue);
  const schema = new SingleTableSchema(params);
  const user = schema.createEntity<User>().as({
    type: 'USER',
    getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
    getRangeKey: () => ['#DATA'],
  });

  return {
    methods: new SingleTableFromEntityMethods(user, params).buildMethods(),
    params,
  };
}

describe('single table - from entity - batch writes', () => {
  it('should create entity items and forward batch options', async () => {
    const batchResult = { unprocessed: [createUser('unprocessed')] };
    const { methods, params } = setup('batchCreate', batchResult);
    const items = [createUser('1'), createUser('2')];

    const result = await methods.batchCreate({
      items,
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(params.dynamodbProvider.batchCreate).toHaveBeenCalledWith({
      table: params.table,
      items: items.map((item) => ({
        ...item,
        hello: `USER#${item.id}`,
        key: '#DATA',
        _type: 'USER',
        _ts: expect.any(String),
      })),
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });

  it('should resolve entity keys and forward batch delete options', async () => {
    const batchResult = {
      unprocessed: [{ hello: 'USER#unprocessed', key: '#DATA' }],
    };
    const { methods, params } = setup('batchDelete', batchResult);

    const result = await methods.batchDelete({
      items: [{ id: '1' }, { id: '2' }],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(params.dynamodbProvider.batchDelete).toHaveBeenCalledWith({
      table: params.table,
      items: [
        { hello: 'USER#1', key: '#DATA' },
        { hello: 'USER#2', key: '#DATA' },
      ],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });

  it('should resolve mixed creations and deletes for batch mutate', async () => {
    const batchResult = {
      unprocessed: {
        creations: [createUser('unprocessed')],
        deletes: [{ hello: 'USER#unprocessed', key: '#DATA' }],
      },
    };
    const { methods, params } = setup('batchMutate', batchResult);
    const creation = createUser('new');

    const result = await methods.batchMutate({
      creations: [creation],
      deletes: [{ id: 'old' }],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });

    expect(params.dynamodbProvider.batchMutate).toHaveBeenCalledWith({
      table: params.table,
      creations: [
        {
          ...creation,
          hello: 'USER#new',
          key: '#DATA',
          _type: 'USER',
          _ts: expect.any(String),
        },
      ],
      deletes: [{ hello: 'USER#old', key: '#DATA' }],
      maxRetries: 3,
      throwOnUnprocessed: true,
    });
    expect(result).toBe(batchResult);
  });

  it('[TYPES] should infer entity creations, key deletes, and batch results', () => {
    const { methods } = setup('batchMutate', {});

    type CreateParams = Parameters<typeof methods.batchCreate>[0];
    type DeleteParams = Parameters<typeof methods.batchDelete>[0];
    type MutateParams = Parameters<typeof methods.batchMutate>[0];

    type _CreateItem = Expect<Equal<PrettifyObject<CreateParams['items'][number]>, User>>;
    type _DeleteItem = Expect<
      Equal<PrettifyObject<DeleteParams['items'][number]>, { id: string }>
    >;
    type _MutateCreation = Expect<
      Equal<PrettifyObject<NonNullable<MutateParams['creations']>[number]>, User>
    >;
    type _MutateDelete = Expect<
      Equal<PrettifyObject<NonNullable<MutateParams['deletes']>[number]>, { id: string }>
    >;
    type _CreateResult = Expect<
      Equal<Awaited<ReturnType<typeof methods.batchCreate>>, BatchCreateResult<User>>
    >;
    type _DeleteResult = Expect<
      Equal<Awaited<ReturnType<typeof methods.batchDelete>>, BatchDeleteResult<User>>
    >;
    type _MutateResult = Expect<
      Equal<Awaited<ReturnType<typeof methods.batchMutate>>, BatchMutateResult<User>>
    >;
  });
});
