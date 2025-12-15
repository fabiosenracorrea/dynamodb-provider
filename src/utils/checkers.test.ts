import { isNonNullable } from './checkers';

describe('checkers tests', () => {
  describe('isNonNullable', () => {
    it('should detect null', () => {
      expect(isNonNullable(null)).toBe(false);
    });

    it('should detect undefined', () => {
      expect(isNonNullable(undefined)).toBe(false);
    });

    it('should not detect other falsy values', () => {
      const falsyValues = [0, NaN, [], ''];

      falsyValues.forEach((value) => {
        expect(isNonNullable(value)).toBe(true);
      });
    });
  });
});
