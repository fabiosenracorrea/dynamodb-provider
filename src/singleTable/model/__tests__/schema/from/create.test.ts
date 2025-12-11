/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal, PrettifyObject } from 'types';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { paramsFor, User } from './helpers.test';

// Here we intercept the calls to verify just the missing part of the flow is working
// getCreationParams is tested in isolation in definitions/entity/crud.spec.ts
describe('single table - from entity - create', () => {
  it("should use entity's getCreationParams fn", async () => {
    const params = paramsFor('create', {});

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const create = jest.fn();
    (instance as any).methods = { create };

    const getCreationParams = jest.fn().mockReturnValue({
      item: 'mocked-result',
    });

    user.getCreationParams = getCreationParams;

    const createUser = {
      address: 'add',
      createdAt: 'created',
      dob: 'dob',
      email: 'email',
      id: 'id',
      name: 'name',
    };

    await instance.buildMethods().create(createUser);

    expect(getCreationParams).toHaveBeenCalledTimes(1);
    expect(getCreationParams).toHaveBeenCalledWith(createUser);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      item: 'mocked-result',
    });
  });

  it('should forward second param (expiresAt) to getCreationParams', async () => {
    const params = paramsFor('create', {});

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const create = jest.fn();
    (instance as any).methods = { create };

    const getCreationParams = jest.fn().mockReturnValue({
      item: 'mocked-result',
    });

    user.getCreationParams = getCreationParams;

    const createUser = {
      address: 'add',
      createdAt: 'created',
      dob: 'dob',
      email: 'email',
      id: 'id',
      name: 'name',
    };

    const configSymbol = Symbol('config-untouched') as any;

    await instance.buildMethods().create(createUser, configSymbol);

    expect(getCreationParams).toHaveBeenCalledTimes(1);
    expect(getCreationParams).toHaveBeenCalledWith(createUser, configSymbol);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      item: 'mocked-result',
    });
  });

  it('[TYPES] Input type should be Entity', async () => {
    const params = paramsFor('create', {});

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const createFn = instance.buildMethods().create;

    type Input1 = PrettifyObject<Parameters<typeof createFn>[0]>;

    type _R = Expect<Equal<Input1, User>>;
  });

  it('[TYPES] Return type should be Entity', async () => {
    const params = paramsFor('create', {});

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const result = await instance.buildMethods().create({
      address: 'add',
      createdAt: 'created',
      dob: 'dob',
      email: 'email',
      id: 'id',
      name: 'name',
    });

    type _R = Expect<Equal<typeof result, User>>;
  });

  it('[TYPES] Extend: Return type should be (Entity & extend) if _extend_ is provided', async () => {
    const params = paramsFor('create', {});

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: ['#DATA'],

      extend: () => ({
        newProperty: 10,
      }),
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const createUser: User = {
      address: 'add',
      createdAt: 'created',
      dob: 'dob',
      email: 'email',
      id: 'id',
      name: 'name',
    };

    const result = await instance.buildMethods().create(createUser);

    interface NewUser567 extends User {
      newProperty: number;
    }

    // @ts-expect-error User is not enough
    type _R = Expect<Equal<typeof result, User>>;

    type _R2 = Expect<Equal<typeof result, NewUser567>>;
  });

  it('[TYPES] expiresAt parameter should only be available when table has expiresAt configured', async () => {
    const paramsWithExpires = paramsFor('create', {});

    const schema = new SingleTableSchema(paramsWithExpires);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, paramsWithExpires);

    const createUser: User = {
      address: 'add',
      createdAt: 'created',
      dob: 'dob',
      email: 'email',
      id: 'id',
      name: 'name',
    };

    // Should work with expiresAt when table has it configured
    instance.buildMethods().create(createUser, { expiresAt: 123456 });

    const { expiresAt: _, ...paramsWithoutExpires } = paramsWithExpires;

    const schemaNoExpires = new SingleTableSchema(paramsWithoutExpires);

    const userNoExpires = schemaNoExpires.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instanceNoExpires = new SingleTableFromEntityMethods(
      userNoExpires,
      paramsWithoutExpires,
    );

    // @ts-expect-error expiresAt should not be available when table doesn't have it configured
    instanceNoExpires.buildMethods().create(createUser, { expiresAt: 123456 });
  });
});
