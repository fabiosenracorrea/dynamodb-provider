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

  describe('numeric index support', () => {
    it('transformIndexReferences: should preserve numeric range key for numeric indexes', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          RankingIndex: {
            partitionKey: '_indexHash1',
            rangeKey: '_indexRange1',
            numeric: true,
          },
          StringIndex: {
            partitionKey: '_indexHash2',
            rangeKey: '_indexRange2',
          },
        },
      };

      const result = transformIndexReferences(
        {
          RankingIndex: {
            partitionKey: 'LEADERBOARD',
            rangeKey: [1500],
          },
          StringIndex: {
            partitionKey: 'USER',
            rangeKey: 'some-string',
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _indexHash1: 'LEADERBOARD',
        _indexRange1: 1500,
        _indexHash2: 'USER',
        _indexRange2: 'some-string',
      });
    });

    it('transformIndexReferences: should handle zero as valid numeric range key', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          CountIndex: {
            partitionKey: '_countPk',
            rangeKey: '_count',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          CountIndex: {
            partitionKey: 'COUNTER',
            rangeKey: [0],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _countPk: 'COUNTER',
        _count: 0,
      });
    });

    it('transformIndexReferences: should handle negative numbers as valid numeric range key', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          BalanceIndex: {
            partitionKey: '_balancePk',
            rangeKey: '_balance',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          BalanceIndex: {
            partitionKey: 'ACCOUNT',
            rangeKey: [-500],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _balancePk: 'ACCOUNT',
        _balance: -500,
      });
    });

    it('transformIndexReferences: should ignore non-number values for numeric index range key', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          NumericIndex: {
            partitionKey: '_numPk',
            rangeKey: '_numRange',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          NumericIndex: {
            partitionKey: 'TEST',
            rangeKey: ['not-a-number'],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _numPk: 'TEST',
      });
    });

    it('transformIndexReferences: should ignore array with multiple values for numeric index range key', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          NumericIndex: {
            partitionKey: '_numPk',
            rangeKey: '_numRange',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          NumericIndex: {
            partitionKey: 'TEST',
            rangeKey: [100, 200],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _numPk: 'TEST',
      });
    });

    it('transformIndexReferences: should still convert partition key to string for numeric indexes', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          NumericIndex: {
            partitionKey: '_numPk',
            rangeKey: '_numRange',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          NumericIndex: {
            partitionKey: ['PREFIX', 'value'],
            rangeKey: [100],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _numPk: 'PREFIX#value',
        _numRange: 100,
      });
    });

    it('transformIndexReferences: should handle mixed numeric and string indexes correctly', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          RankingIndex: {
            partitionKey: '_rankPk',
            rangeKey: '_rankScore',
            numeric: true,
          },
          DateIndex: {
            partitionKey: '_datePk',
            rangeKey: '_dateRange',
          },
          CounterIndex: {
            partitionKey: '_counterPk',
            rangeKey: '_counterValue',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          RankingIndex: {
            partitionKey: 'LEADERBOARD',
            rangeKey: [2500],
          },
          DateIndex: {
            partitionKey: 'LOGS',
            rangeKey: ['2024', '01', '15'],
          },
          CounterIndex: {
            partitionKey: 'VIEWS',
            rangeKey: [0],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _rankPk: 'LEADERBOARD',
        _rankScore: 2500,
        _datePk: 'LOGS',
        _dateRange: '2024#01#15',
        _counterPk: 'VIEWS',
        _counterValue: 0,
      });

      // Verify types
      expect(typeof result._rankScore).toBe('number');
      expect(typeof result._dateRange).toBe('string');
      expect(typeof result._counterValue).toBe('number');
    });

    it('transformIndexReferences: should ignore empty/undefined range key for numeric indexes', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          NumericIndex: {
            partitionKey: '_numPk',
            rangeKey: '_numRange',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          NumericIndex: {
            partitionKey: 'TEST',
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _numPk: 'TEST',
      });
    });

    it('transformIndexReferences: should ignore null range key for numeric indexes', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          NumericIndex: {
            partitionKey: '_numPk',
            rangeKey: '_numRange',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          NumericIndex: {
            partitionKey: 'TEST',
            rangeKey: null,
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _numPk: 'TEST',
      });
    });

    it('transformIndexReferences: should ignore empty array range key for numeric indexes', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          NumericIndex: {
            partitionKey: '_numPk',
            rangeKey: '_numRange',
            numeric: true,
          },
        },
      };

      const result = transformIndexReferences(
        {
          NumericIndex: {
            partitionKey: 'TEST',
            rangeKey: [],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _numPk: 'TEST',
      });
    });

    it('transformIndexReferences: non-numeric indexes should still convert numbers to strings', () => {
      const config = {
        table: 'db-table',
        partitionKey: '_pk',
        rangeKey: '_sk',
        indexes: {
          StringIndex: {
            partitionKey: '_indexPk',
            rangeKey: '_indexRange',
            // numeric: false (default)
          },
        },
      };

      const result = transformIndexReferences(
        {
          StringIndex: {
            partitionKey: 'TEST',
            rangeKey: [42],
          },
        },
        config,
      );

      expect(result).toStrictEqual({
        _indexPk: 'TEST',
        _indexRange: '42',
      });

      // Verify it's a string, not a number
      expect(typeof result._indexRange).toBe('string');
    });
  });
});
