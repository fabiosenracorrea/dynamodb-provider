/* eslint-disable @typescript-eslint/no-explicit-any */

import { Equal, Expect } from 'types';
import { isValidNumericIndexRef, NumericIndex } from './numericRef';
import { SingleTableConfig } from '../config';

describe('numericRef utilities', () => {
  describe('isValidNumericIndexRef', () => {
    it('should return true for a valid numeric index', () => {
      const result = isValidNumericIndexRef('LeaderboardIndex', {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {
          LeaderboardIndex: {
            partitionKey: 'gsi1pk',
            rangeKey: 'gsi1sk',
            numeric: true,
          },
        },
      });

      expect(result).toBe(true);
    });

    it('should return false for a non-numeric index', () => {
      const result = isValidNumericIndexRef('RegularIndex', {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {
          RegularIndex: {
            partitionKey: 'gsi1pk',
            rangeKey: 'gsi1sk',
            numeric: false,
          },
        },
      });

      expect(result).toBe(false);
    });

    it('should return false for an index without numeric flag (defaults to undefined)', () => {
      const result = isValidNumericIndexRef('DefaultIndex', {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {
          DefaultIndex: {
            partitionKey: 'gsi1pk',
            rangeKey: 'gsi1sk',
          },
        },
      });

      expect(result).toBe(false);
    });

    it('should return false for a non-existent index', () => {
      const config: SingleTableConfig = {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {
          ExistingIndex: {
            partitionKey: 'gsi1pk',
            rangeKey: 'gsi1sk',
            numeric: true,
          },
        },
      };

      const result = isValidNumericIndexRef('NonExistentIndex', config);

      expect(result).toBe(false);
    });

    it('should return false when config has no indexes defined', () => {
      const config: SingleTableConfig = {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
      };

      const result = isValidNumericIndexRef('AnyIndex', config);

      expect(result).toBe(false);
    });

    it('should return false when indexes is an empty object', () => {
      const config: SingleTableConfig = {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {},
      };

      const result = isValidNumericIndexRef('AnyIndex', config);

      expect(result).toBe(false);
    });

    it('should handle multiple indexes and validate the correct one', () => {
      const config: SingleTableConfig = {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {
          ScoreIndex: {
            partitionKey: 'gsi1pk',
            rangeKey: 'score',
            numeric: true,
          },
          NameIndex: {
            partitionKey: 'gsi2pk',
            rangeKey: 'name',
            numeric: false,
          },
          RankIndex: {
            partitionKey: 'gsi3pk',
            rangeKey: 'rank',
            numeric: true,
          },
        },
      };

      expect(isValidNumericIndexRef('ScoreIndex', config)).toBe(true);
      expect(isValidNumericIndexRef('NameIndex', config)).toBe(false);
      expect(isValidNumericIndexRef('RankIndex', config)).toBe(true);
      expect(isValidNumericIndexRef('NonExistent', config)).toBe(false);
    });

    it('should return false for numeric: false explicitly set', () => {
      const config: SingleTableConfig = {
        table: 'TestTable',
        partitionKey: 'pk',
        rangeKey: 'sk',
        indexes: {
          ExplicitlyNonNumeric: {
            partitionKey: 'gsi1pk',
            rangeKey: 'gsi1sk',
            numeric: false,
          },
        },
      };

      const result = isValidNumericIndexRef('ExplicitlyNonNumeric', config);

      expect(result).toBe(false);
    });
  });

  describe('NumericIndex type utility', () => {
    it('should correctly infer numeric index names at type level', () => {
      type TestIndexes = {
        ScoreIndex: { numeric: true; partitionKey: string; rangeKey: string };
        NameIndex: { numeric: false; partitionKey: string; rangeKey: string };
        RankIndex: { numeric: true; partitionKey: string; rangeKey: string };
        DefaultIndex: { partitionKey: string; rangeKey: string };
      };

      // This type should only include 'ScoreIndex' | 'RankIndex'
      // @ts-expect-error ok call
      type NumericIndexNames = NumericIndex<TestIndexes>;

      type _t = Expect<Equal<NumericIndexNames, 'ScoreIndex' | 'RankIndex'>>;
    });

    it('should result in never type when no numeric indexes exist', () => {
      type TestIndexes = {
        Index1: { numeric: false; partitionKey: string; rangeKey: string };
        Index2: { partitionKey: string; rangeKey: string };
      };

      // @ts-expect-error ok call
      type NumericIndexNames = NumericIndex<TestIndexes>;

      type _t = Expect<Equal<NumericIndexNames, never>>;
    });
  });
});
