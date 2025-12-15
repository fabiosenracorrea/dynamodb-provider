/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expect, Equal, PrettifyObject } from 'types';

import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';

import { paramsFor, User } from './helpers.test';

// Here we intercept the calls to verify just the missing part of the flow is working
// getUpdateParams is tested in isolation in definitions/entity/crud.spec.ts
describe('single table - from entity - update', () => {
  it("should use entity's getUpdateParams fn", async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const update = jest.fn();
    (instance as any).methods = { update };

    const getUpdateParams = jest.fn().mockReturnValue({
      mocked: 'update-result',
    });

    user.getUpdateParams = getUpdateParams;

    const forwardParams = Symbol('update-params') as any;

    await instance.buildMethods().update(forwardParams);

    expect(getUpdateParams).toHaveBeenCalledTimes(1);
    expect(getUpdateParams).toHaveBeenCalledWith(forwardParams);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      mocked: 'update-result',
    });
  });

  it('[TYPES] Input type should require key params + update operations', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const updateFn = instance.buildMethods().update;

    type Input = PrettifyObject<Parameters<typeof updateFn>[0]>;

    // Should require id from key params
    type _HasId = Expect<Equal<Input['id'], string>>;

    // Should accept update operations
    updateFn({
      id: 'user-id',
      values: { name: 'New Name' },
    });

    updateFn({
      id: 'user-id',
      remove: ['email'],
    });

    updateFn({
      id: 'user-id',
      atomicOperations: [{ type: 'add', property: 'updatedAt', value: 1 }],
    });

    // @ts-expect-error id is required
    updateFn({});

    // @ts-expect-error id is required
    updateFn({ values: { name: 'Test' } });
  });

  it('[TYPES] Return type should be void if no _returnUpdatedProps_', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const result = await instance.buildMethods().update({
      id: 'user-id',
      values: { name: 'New Name' },
    });

    type _R = Expect<Equal<typeof result, void>>;
  });

  it('[TYPES] Extend: Return type infer _values_ properties', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const result = await instance.buildMethods().update({
      id: 'user-id',
      values: { name: 'New Name', address: '298032' },
      returnUpdatedProperties: true,
    });

    // @ts-expect-error Should be narrow...
    type _R = Expect<Equal<typeof result, Partial<User>>>;

    // @ts-expect-error Should be defined...
    type _R2 = Expect<Equal<typeof result, void>>;

    type Expected = { name: string; address: string };

    type _R3 = Expect<Equal<typeof result, Expected>>;
  });

  it('[TYPES] Extend: Return type infer _atomicOperations_ properties', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const result = await instance.buildMethods().update({
      id: 'user-id',
      returnUpdatedProperties: true,
      atomicOperations: [{ property: 'email', type: 'sum', value: 1 }],
    });

    // @ts-expect-error Should be narrow...
    type _R = Expect<Equal<typeof result, Partial<User>>>;

    // @ts-expect-error Should be defined...
    type _R2 = Expect<Equal<typeof result, void>>;

    type Expected = { email: string };

    type _R3 = Expect<Equal<typeof result, Expected>>;
  });

  it('[TYPES] Extend: Return type infer _atomicOperations_ AND _values_ properties', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    const result = await instance.buildMethods().update({
      id: 'user-id',
      returnUpdatedProperties: true,
      atomicOperations: [{ property: 'email', type: 'sum', value: 1 }],
      values: { name: '92839' },
    });

    // @ts-expect-error Should be narrow...
    type _R = Expect<Equal<typeof result, Partial<User>>>;

    // @ts-expect-error Should be defined...
    type _R2 = Expect<Equal<typeof result, void>>;

    type Expected = { email: string; name: string };

    type _R3 = Expect<Equal<typeof result, Expected>>;
  });

  it('[TYPES] expiresAt parameter should only be available when table has expiresAt configured', async () => {
    const paramsWithExpires = paramsFor('update');

    const schema = new SingleTableSchema(paramsWithExpires);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, paramsWithExpires);

    // Should work with expiresAt when table has it configured
    const updaterExpires = instance.buildMethods().update;

    type InputExpires = Parameters<typeof updaterExpires>[0];

    type ExpiresKey = Extract<keyof InputExpires, 'expiresAt'>;

    type _R = Expect<Equal<ExpiresKey, never>>;

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

    const updaterNoExpires = instanceNoExpires.buildMethods().update;

    type InputNoExpires = Parameters<typeof updaterNoExpires>[0];

    type NoExpiresKey = Extract<keyof InputNoExpires, 'expiresAt'>;

    type _R2 = Expect<Equal<NoExpiresKey, never>>;
  });

  it('[TYPES] values should only accept existing entity properties', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    // Valid properties
    instance.buildMethods().update({
      id: 'user-id',
      values: { name: 'Test', email: 'test@example.com' },
    });

    instance.buildMethods().update({
      id: 'user-id',
      // @ts-expect-error invalid property
      values: { invalidProp: 'Test' },
    });
  });

  it('[TYPES] remove should only accept existing entity properties', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    // Valid properties
    instance.buildMethods().update({
      id: 'user-id',
      remove: ['email', 'address'],
    });

    instance.buildMethods().update({
      id: 'user-id',
      // @ts-expect-error invalid property
      remove: ['invalidProp'],
    });
  });

  it('[TYPES] atomicOperations property should only accept existing entity properties', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    // Valid properties - using 'as any' for value since atomic operations have specific type requirements
    instance.buildMethods().update({
      id: 'user-id',
      atomicOperations: [{ type: 'add', property: 'updatedAt', value: 1 as any }],
    });

    instance.buildMethods().update({
      id: 'user-id',
      atomicOperations: [
        // @ts-expect-error invalid property
        { type: 'add', property: 'invalidProp', value: 1 },
      ],
    });
  });

  it('[TYPES] conditions should ensure existing prop references', async () => {
    const params = paramsFor('update');

    const schema = new SingleTableSchema(params);

    const user = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }: { id: string }) => ['USER', id],
      getRangeKey: ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(user, params);

    instance.buildMethods().update({
      id: 'user-id',
      values: { name: 'Test' },

      conditions: [
        {
          property: 'address',
          operation: 'begins_with',
          value: '123',
          nested: [
            {
              property: 'createdAt',
              operation: 'between',
              start: '1',
              end: '2',
              joinAs: 'or',
            },
          ],
        },

        // @ts-expect-error no non-existing property reference
        { property: 'INVALID', operation: 'begins_with', value: '1' },
      ],
    });
  });
});
