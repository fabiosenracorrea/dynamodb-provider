/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableGetter } from './get';

describe('single table adaptor - dynamodb', () => {
  it('should properly call/return the db provider get method with the standard use case', async () => {
    const getMock = jest.fn().mockResolvedValue({ prop: 'value', name: 'hello', age: 27 });

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },
    });

    expect(result).toStrictEqual({ prop: 'value', name: 'hello', age: 27 });
  });

  it('should not return if db provider results in undefined', async () => {
    const getMock = jest.fn();

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },
    });

    expect(result).toBe(undefined);
  });

  it('should forward consistentRead', async () => {
    const getMock = jest.fn().mockResolvedValue({ prop: 'value', name: 'hello', age: 27 });

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
      consistentRead: true,
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },

      consistentRead: true,
    });

    expect(result).toStrictEqual({ prop: 'value', name: 'hello', age: 27 });
  });

  it('should forward propertiesToRetrieve', async () => {
    const getMock = jest.fn().mockResolvedValue({ prop: 'value', name: 'hello', age: 27 });

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
      consistentRead: true,
      propertiesToRetrieve: ['prop', 'name', 'age'],
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },

      consistentRead: true,
      propertiesToRetrieve: ['prop', 'name', 'age'],
    });

    expect(result).toStrictEqual({ prop: 'value', name: 'hello', age: 27 });
  });

  it('should remove internal properties', async () => {
    const getMock = jest.fn().mockResolvedValue({
      prop: 'value',
      name: 'hello',
      age: 27,
      _type: 'SOME_TYPE',
      _pk: 'some',
      _sk: 'other',
      _ts: '123',
    });

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },
    });

    expect(result).toStrictEqual({ prop: 'value', name: 'hello', age: 27 });
  });

  it('should keep the type prop if configured', async () => {
    const getMock = jest
      .fn()
      .mockResolvedValue({ prop: 'value', name: 'hello', age: 27, _type: 'SOME_TYPE' });

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
        keepTypeProperty: true,
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },
    });

    expect(result).toStrictEqual({ prop: 'value', name: 'hello', age: 27, _type: 'SOME_TYPE' });
  });

  it('should use prop cleanup fn to resolve kept properties if configured', async () => {
    const getMock = jest.fn().mockResolvedValue({
      prop: 'value',
      name: 'hello',
      age: 27,
      _type: 'SOME_TYPE',
      _pk: 'some',
      _sk: 'other',
      _ts: '123',
    });

    const getter = new SingleTableGetter({
      db: {
        get: getMock,
      } as any,

      config: {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        typeIndex: {
          name: 'TypeIndexName',
          partitionKey: '_type',
          rangeKey: '_ts',
        },
        propertyCleanup: ({ _sk, _ts, ...item }) => item,
      },
    });

    const result = await getter.get<any>({
      partitionKey: 'some',
      rangeKey: 'other_pk',
    });

    expect(getMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith({
      table: 'db-table',

      key: {
        _pk: 'some',
        _sk: 'other_pk',
      },
    });

    expect(result).toStrictEqual({
      prop: 'value',
      name: 'hello',
      age: 27,
      _type: 'SOME_TYPE',
      _pk: 'some',
    });
  });
});
