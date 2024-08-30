import { omit, pick, removeUndefinedProps } from './object';

describe('object utils', () => {
  describe('pick', () => {
    it('should return a new object with the properties chosen', () => {
      const obj = {
        some: '22',
        other: '22',
        prop: '22',
        test: '22',
        another: '22',
      };

      const result = pick(obj, ['another', 'prop']);

      expect(result).toStrictEqual({
        prop: '22',
        another: '22',
      });
    });
  });

  describe('omit', () => {
    it('should remove every prop passed in', () => {
      const obj = {
        some: '22',
        other: '22',
        prop: '22',
        test: '22',
        another: '22',
      };

      const result = omit(obj, ['another', 'prop']);

      expect(result).toStrictEqual({
        some: '22',
        other: '22',
        test: '22',
      });
    });
  });

  describe('removeUndefinedProps', () => {
    it('should remove all undefined properties', () => {
      const obj = {
        some: '22',
        other: '22',
        prop: '22',
        test: '22',
        another: undefined,
        hello: undefined,
      };

      const result = removeUndefinedProps(obj);

      expect(result).toStrictEqual({
        some: '22',
        other: '22',
        prop: '22',
        test: '22',
      });
    });
  });
});
