/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getIndexHashName,
  getIndexRangeName,
  transformIndexReferences,
} from './tableIndex';

describe('single table adaptor - index helpers', () => {
  it('getIndexHashName: should properly match referenced index to its partition column name', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = getIndexHashName('SomeIndex', config);

    expect(result).toBe('_indexHash1');
  });

  it('getIndexRangeName: should properly match referenced index to its range column name', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = getIndexRangeName('anotherIndex', config);

    expect(result).toBe('_indexRange2');
  });

  it('transformIndexReferences: should create the index obj reference', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = transformIndexReferences(
      {
        SomeIndex: {
          partitionKey: 'in2',
          rangeKey: 'bh6',
        },

        anotherIndex: {
          partitionKey: 'another',
        },

        yetAnotherIndex: {
          rangeKey: 'range',
        },
      },
      config,
    );

    expect(result).toStrictEqual({
      _indexHash1: 'in2',
      _indexRange1: 'bh6',
      _indexHash2: 'another',
      _indexRange3: 'range',
    });
  });

  it('transformIndexReferences: not add null keys', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = transformIndexReferences(
      {
        SomeIndex: {
          partitionKey: 'in2',
          rangeKey: 'bh6',
        },

        anotherIndex: {
          partitionKey: 'another',
          rangeKey: null,
        },

        yetAnotherIndex: {
          rangeKey: 'range',
          partitionKey: [1, null],
        },
      },
      config,
    );

    expect(result).toStrictEqual({
      _indexHash1: 'in2',
      _indexRange1: 'bh6',
      _indexHash2: 'another',
      _indexRange3: 'range',
    });
  });

  it('transformIndexReferences: not add undefined keys', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = transformIndexReferences(
      {
        SomeIndex: {
          partitionKey: 'in2',
          rangeKey: 'bh6',
        },

        anotherIndex: {
          partitionKey: 'another',
          rangeKey: undefined,
        },

        yetAnotherIndex: {
          rangeKey: 'range',
          partitionKey: ['2', undefined] as any,
        },
      },
      config,
    );

    expect(result).toStrictEqual({
      _indexHash1: 'in2',
      _indexRange1: 'bh6',
      _indexHash2: 'another',
      _indexRange3: 'range',
    });
  });

  it('transformIndexReferences: not add empty list keys', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = transformIndexReferences(
      {
        SomeIndex: {
          partitionKey: 'in2',
          rangeKey: 'bh6',
        },

        anotherIndex: {
          partitionKey: 'another',
        },

        yetAnotherIndex: {
          rangeKey: 'range',
          partitionKey: [],
        },
      },
      config,
    );

    expect(result).toStrictEqual({
      _indexHash1: 'in2',
      _indexRange1: 'bh6',
      _indexHash2: 'another',
      _indexRange3: 'range',
    });
  });

  it('transformIndexReferences: should join list references keys with default #', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = transformIndexReferences(
      {
        SomeIndex: {
          partitionKey: 'in2',
          rangeKey: ['VALUE', 'bh6'],
        },

        anotherIndex: {
          partitionKey: [0, 'another'],
        },

        yetAnotherIndex: {
          rangeKey: 'range',
          partitionKey: [],
        },
      },
      config,
    );

    expect(result).toStrictEqual({
      _indexHash1: 'in2',
      _indexRange1: 'VALUE#bh6',
      _indexHash2: '0#another',
      _indexRange3: 'range',
    });
  });

  it('transformIndexReferences: should join list references keys with custom separator', () => {
    const config = {
      table: 'db-table',
      partitionKey: '_pk',
      rangeKey: '_sk',
      keySeparator: '@',
      typeIndex: {
        name: 'TypeIndexName',
        partitionKey: '_type',
        rangeKey: '_ts',
      },
      indexes: {
        SomeIndex: {
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
    };

    const result = transformIndexReferences(
      {
        SomeIndex: {
          partitionKey: 'in2',
          rangeKey: ['VALUE', 'bh6'],
        },

        anotherIndex: {
          partitionKey: [0, 'another'],
        },

        yetAnotherIndex: {
          rangeKey: 'range',
          partitionKey: [],
        },
      },
      config,
    );

    expect(result).toStrictEqual({
      _indexHash1: 'in2',
      _indexRange1: 'VALUE@bh6',
      _indexHash2: '0@another',
      _indexRange3: 'range',
    });
  });
});
