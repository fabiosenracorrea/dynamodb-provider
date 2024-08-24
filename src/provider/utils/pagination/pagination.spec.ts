import { fromPaginationToken, toPaginationToken } from './index';

describe('pagination token helpers', () => {
  describe('conversion to token', () => {
    it('should properly convert an object to a string token, base64', () => {
      const example = {
        key1: 1,
        key2: 2,
        key3: 3,
      };

      const expected = Buffer.from(JSON.stringify(example), 'utf-8').toString('base64');

      expect(toPaginationToken(example)).toBe(expected);
    });
  });

  describe('conversion from token', () => {
    it('should properly extract from a valid base64', () => {
      const example = {
        key1: 1,
        key2: 2,
        key3: 3,
      };

      const token = Buffer.from(JSON.stringify(example), 'utf-8').toString('base64');

      expect(fromPaginationToken(token)).toEqual(example);
    });

    it('should return undefined if bad token provided', () => {
      expect(fromPaginationToken('bad_token')).toBe(undefined);
    });

    it('should return undefined if token that does not originate an object is provided', () => {
      const badButValidJSONtokens = [null, 'hello', [2, 3]].map((x) =>
        Buffer.from(JSON.stringify(x), 'utf-8').toString('base64'),
      );

      badButValidJSONtokens.forEach((badToken) => {
        expect(fromPaginationToken(badToken)).toBe(undefined);
      });
    });
  });
});
