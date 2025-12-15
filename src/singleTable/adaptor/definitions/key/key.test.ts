/* eslint-disable @typescript-eslint/no-explicit-any */

import { convertKey, getPrimaryKey } from './key';

describe('single table key helpers', () => {
  describe('convertKey', () => {
    it('should handle non-array references', () => {
      const values = [1, '1', null];

      values.forEach((value) => {
        expect(convertKey(value, {} as any)).toBe(`${value}`);
      });
    });

    it('should handle array references with # as default joiner', () => {
      const result = convertKey(['USER', 'some-id'], {} as any);

      expect(result).toEqual('USER#some-id');
    });

    it('should handle array references with custom joiner', () => {
      const result = convertKey(['USER', 'some-id'], {
        keySeparator: '@',
      } as any);

      expect(result).toEqual('USER@some-id');
    });

    it('should handle single item array', () => {
      const result = convertKey(['USER'], {} as any);

      expect(result).toEqual('USER');
    });
  });

  describe('getPrimaryKey', () => {
    it('should properly reference the single table key', () => {
      const key = getPrimaryKey(
        {
          partitionKey: 'USER',
          rangeKey: 'some-id-99',
        },
        {
          partitionKey: '_pk',
          rangeKey: '_sk',
          table: 'some_table',
        },
      );

      expect(key).toStrictEqual({
        _pk: 'USER',
        _sk: 'some-id-99',
      });
    });

    it('[partition] should handle array references with default joiner #', () => {
      const key = getPrimaryKey(
        {
          partitionKey: ['0', 'some-id-99'],
          rangeKey: 'USER',
        },
        {
          partitionKey: '_pk',
          rangeKey: '_sk',
          table: 'some_table',
        },
      );

      expect(key).toStrictEqual({
        _sk: 'USER',
        _pk: '0#some-id-99',
      });
    });

    it('[partition] should handle array references with custom joiner', () => {
      const key = getPrimaryKey(
        {
          rangeKey: 'USER',
          partitionKey: ['0', 'some-id-99'],
        },
        {
          partitionKey: '_pk',
          rangeKey: '_sk',
          table: 'some_table',
          keySeparator: '@',
        },
      );

      expect(key).toStrictEqual({
        _sk: 'USER',
        _pk: '0@some-id-99',
      });
    });

    it('[range] should handle array references with default joiner #', () => {
      const key = getPrimaryKey(
        {
          partitionKey: 'USER',
          rangeKey: ['0', 'some-id-99'],
        },
        {
          partitionKey: '_pk',
          rangeKey: '_sk',
          table: 'some_table',
        },
      );

      expect(key).toStrictEqual({
        _pk: 'USER',
        _sk: '0#some-id-99',
      });
    });

    it('[range] should handle array references with custom joiner', () => {
      const key = getPrimaryKey(
        {
          partitionKey: 'USER',
          rangeKey: ['0', 'some-id-99'],
        },
        {
          partitionKey: '_pk',
          rangeKey: '_sk',
          table: 'some_table',
          typeIndex: {} as any,
          keySeparator: '@',
        },
      );

      expect(key).toStrictEqual({
        _pk: 'USER',
        _sk: '0@some-id-99',
      });
    });
  });
});
