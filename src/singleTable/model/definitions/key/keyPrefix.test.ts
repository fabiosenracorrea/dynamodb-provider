/* eslint-disable @typescript-eslint/no-explicit-any */
import { toKeyPrefix } from './keyPrefix';

describe('toKeyPrefix', () => {
  describe('when rangeGetter is not provided', () => {
    it('should return empty array when rangeGetter is undefined', () => {
      const result = toKeyPrefix(undefined);

      expect(result).toStrictEqual([]);
    });
  });

  describe('when rangeGetter returns null or undefined', () => {
    it('should return empty array when rangeGetter returns null', () => {
      const rangeGetter = () => null;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([]);
    });

    it('should return empty array when rangeGetter returns undefined', () => {
      const rangeGetter = () => undefined as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([]);
    });
  });

  describe('when rangeGetter returns a single value', () => {
    it('should return array with single truthy value', () => {
      const rangeGetter = () => 'value1';

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });

    it('should return empty array when single value is falsy', () => {
      const rangeGetter = () => null;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([]);
    });
  });

  describe('when rangeGetter returns an array', () => {
    it('should return all elements when all values are truthy', () => {
      const rangeGetter = () => ['value1', 'value2', 'value3'];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1', 'value2', 'value3']);
    });

    it('should return elements up to first falsy value (null)', () => {
      const rangeGetter = () => ['value1', 'value2', null, 'value4'];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1', 'value2']);
    });

    it('should return elements up to first falsy value (undefined)', () => {
      const rangeGetter = () => ['value1', undefined, 'value3'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });

    it('should return empty array when first element is null', () => {
      const rangeGetter = () => [null, 'value2', 'value3'];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([]);
    });

    it('should return empty array when first element is undefined', () => {
      const rangeGetter = () => [undefined, 'value2', 'value3'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([]);
    });

    it('should return all elements when last element is falsy is not encountered before it', () => {
      const rangeGetter = () => ['value1', 'value2', 'value3', null];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1', 'value2', 'value3']);
    });
  });

  describe('edge cases with different falsy values', () => {
    it('should treat 0 as falsy and stop at it', () => {
      const rangeGetter = () => ['value1', 0, 'value3'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });

    it('should treat false as falsy and stop at it', () => {
      const rangeGetter = () => ['value1', false, 'value3'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });

    it('should treat empty string as falsy and stop at it', () => {
      const rangeGetter = () => ['value1', '', 'value3'];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });

    it('should treat NaN as falsy and stop at it', () => {
      const rangeGetter = () => ['value1', NaN, 'value3'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });
  });

  describe('rangeGetter receives empty object as parameter', () => {
    it('should call rangeGetter with empty object', () => {
      const mockRangeGetter = jest.fn(() => ['value1', 'value2']);

      toKeyPrefix(mockRangeGetter);

      expect(mockRangeGetter).toHaveBeenCalledWith({});
      expect(mockRangeGetter).toHaveBeenCalledTimes(1);
    });

    it('should work with rangeGetter that uses the parameter', () => {
      const rangeGetter = (params: any) => {
        // Even though params is empty, function should still work
        return params.id ? [params.id, 'suffix'] : ['default', 'suffix'];
      };

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['default', 'suffix']);
    });
  });

  describe('multiple consecutive falsy values', () => {
    it('should stop at first falsy value even if multiple consecutive falsy values exist', () => {
      const rangeGetter = () => ['value1', null, undefined, 'value4'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1']);
    });

    it('should return empty array when multiple falsy values at start', () => {
      const rangeGetter = () => [null, undefined, 'value3'] as any;

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([]);
    });
  });

  describe('various data types as truthy values', () => {
    it('should handle numbers as truthy values', () => {
      const rangeGetter = () => [1, 2, 3];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual([1, 2, 3]);
    });

    it('should handle mixed string and number types', () => {
      const rangeGetter = () => ['string', 123, 'another', 456];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['string', 123, 'another', 456]);
    });

    it('should handle null values in valid positions', () => {
      const rangeGetter = () => ['value1', 'value2', null];

      const result = toKeyPrefix(rangeGetter);

      expect(result).toStrictEqual(['value1', 'value2']);
    });
  });
});
