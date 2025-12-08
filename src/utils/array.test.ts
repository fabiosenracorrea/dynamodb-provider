/* eslint-disable @typescript-eslint/no-explicit-any */
import { getLastIndex, getFirstItem, getLastItem, getNextIndex, ensureMaxArraySize } from './array';

describe('array helpers', () => {
  describe('accessors', () => {
    it('getLastIndex: should get the last index of the array', () => {
      const array = [1, 2, 3, 4];

      expect(getLastIndex(array)).toBe(3);
    });

    it('getLastIndex: should return -1 if empty array', () => {
      const array = [] as any[];

      expect(getLastIndex(array)).toBe(-1);
    });

    it('getFirstItem: should return the first item of the array', () => {
      const array = [1, 2, 3, 4];

      expect(getFirstItem(array)).toBe(1);
    });

    it('getFirstItem: should return undefined if no item in array', () => {
      const array = [] as any[];

      expect(getFirstItem(array)).toBe(undefined);
    });

    it('getLastItem: should return the last item of the array', () => {
      const array = [1, 2, 3, 4];

      expect(getLastItem(array)).toBe(4);
    });

    it('getLastItem: should return undefined if no item in array', () => {
      const array = [] as any[];

      expect(getLastItem(array)).toBe(undefined);
    });

    it('getNextIndex: should return the number added by 1', () => {
      const indexes = [0, 1, 5, 50, 90];

      indexes.forEach((n) => {
        expect(getNextIndex(n)).toBe(n + 1);
      });
    });
  });

  describe('max array size', () => {
    it('should respect the length passed in if array size is less', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];

      const result = ensureMaxArraySize(array, 100);

      expect(result).toStrictEqual([array]);
    });

    it('should split the array if its size is bigger than the limit passed', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

      const result = ensureMaxArraySize(array, 2);

      expect(result).toStrictEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11]]);
    });
  });
});
