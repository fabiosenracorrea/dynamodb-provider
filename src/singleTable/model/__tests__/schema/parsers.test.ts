/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect } from 'types';

import { SingleTableSchema } from '../../schema';
import { tableConfig, User } from './helpers.test';

describe('single table schema - entity - parsers', () => {
  it('should have a _parser_ property if _extend_ is provided', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],

      extend: () => ({
        someProp: 'yes',
      }),
    });

    schema.from(user);

    expect(user.parser).toBeTruthy();

    const baseRef = { name: 'Hey' } as User;

    const parsed = user.parser(baseRef);

    expect(parsed).toStrictEqual({ ...baseRef, someProp: 'yes' });

    // -- TYPES --

    type FnParameters = Parameters<typeof user.parser>;

    type Result = ReturnType<typeof user.parser>;

    interface ExpectedUser123 extends User {
      someProp: string;
    }

    type _Tests = [
      //
      Expect<Equal<Result, ExpectedUser123>>,

      Expect<Equal<FnParameters, [User]>>,
    ];
  });

  it('should NOT have a _parser_ property if _extend_ is NOT provided', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],
    });

    schema.from(user);

    expect(user.parser).toBeUndefined();

    type _Tests = [
      //
      Expect<Equal<typeof user.parser, undefined>>,
    ];
  });

  it('overwriting: extend takes priority over existing properties', () => {
    const schema = new SingleTableSchema(tableConfig);

    const user = schema.createEntity<User>().as({
      type: 'USER',

      getPartitionKey: ({ id }: { id: string }) => ['USER', id],

      getRangeKey: () => ['#DATA'],

      extend: () => ({
        someProp: 'yes',
        id: 123, // overwrite!
      }),
    });

    schema.from(user);

    const parsed = user.parser({ id: '11', dob: '2034-10-21' } as User);

    expect(parsed).toStrictEqual({
      id: 123,
      dob: '2034-10-21',
      someProp: 'yes',
    });

    // -- TYPES --

    type FnParameters = Parameters<typeof user.parser>;

    type Result = ReturnType<typeof user.parser>;

    interface ExpectedUser123 extends Omit<User, 'id'> {
      someProp: string;
      id: number;
    }

    type _Tests = [
      //
      Expect<Equal<Result, ExpectedUser123>>,

      Expect<Equal<FnParameters, [User]>>,
    ];
  });
});
