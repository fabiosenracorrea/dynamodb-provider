import { cascadeEval, quickSwitch } from './conditions';

describe('condition helpers', () => {
  describe('cascadeEval', () => {
    it('should return the first truthy *is* evaluation', () => {
      const result = cascadeEval([
        { is: false, then: 2 },
        { is: 0, then: 40 },
        { is: '', then: 90 },
        { is: 'hello', then: { a: 'b' } },
        { is: null, then: 2 },
        { is: false, then: 2 },
      ]);

      expect(result).toStrictEqual({ a: 'b' });
    });

    it('should return the last condition if no true found', () => {
      const result = cascadeEval([
        { is: false, then: 2 },
        { is: 0, then: 40 },
        { is: '', then: 90 },
        { is: null, then: { a: 'b' } },
        { is: false, then: 2 },
        { is: false, then: 'LAST_THEN' },
      ]);

      expect(result).toBe('LAST_THEN');
    });

    it('should accept a function as *then* that gets called only if its condition is truthy', () => {
      const result = cascadeEval([
        { is: false, then: 2 },
        {
          is: 0,
          then: () => {
            throw new Error('Not called');
          },
        },
        { is: '', then: 90 },
        {
          is: 'hello',
          then: () => ({
            some: 'dangerous',
            result: 'from',
            a: 'call',
          }),
        },
        { is: null, then: 2 },
        { is: false, then: 2 },
      ]);

      expect(result).toStrictEqual({
        some: 'dangerous',
        result: 'from',
        a: 'call',
      });
    });
  });

  describe('quickSwitch', () => {
    it('should behave exactly as a Switch on its basis', () => {
      const result = quickSwitch(1, [
        { is: 0, then: '0' },
        { is: 2, then: '022' },
        { is: 1, then: 'MATCH!' },
        { is: 100, then: 'one hundred' },
      ]);

      expect(result).toBe('MATCH!');
    });

    it('should accept multiple checkers', () => {
      const result = quickSwitch('begins_with', [
        { is: 'equal', then: '0' },
        { is: ['between', 'lower_than'], then: 'som!' },
        { is: 'in', then: 'one hundred' },
        { is: ['not_equal', 'begins_with'], then: 'YES' },
        { is: 'bigger_than', then: 'big' },
      ]);

      expect(result).toBe('YES');
    });

    it('should default to the last one', () => {
      const result = quickSwitch(1, [
        { is: 0, then: '0' },
        { is: 2, then: '022' },
        { is: 10, then: 'MATCH!' },
        { is: 100, then: 'one hundred' },
      ]);

      expect(result).toBe('one hundred');
    });

    it('should accept true as *is* condition', () => {
      const result = quickSwitch(1, [
        { is: 0, then: '0' },
        { is: 2, then: '022' },
        { is: 10, then: 'MATCH!' },
        { is: 100, then: 'one hundred' },
        { is: true, then: 'safe condition' },
      ]);

      expect(result).toBe('safe condition');
    });

    it('should accept a function that gets called only if the condition matches', () => {
      const result = quickSwitch(1, [
        {
          is: 0,
          then: () => {
            throw new Error('Not called');
          },
        },
        { is: 2, then: '022' },
        {
          is: 1,
          then: () => ({
            result: 'MATCH!',
          }),
        },
        { is: 100, then: 'one hundred' },
      ]);

      expect(result).toStrictEqual({
        result: 'MATCH!',
      });
    });
  });
});
