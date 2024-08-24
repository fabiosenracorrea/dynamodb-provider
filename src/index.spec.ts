import { sumTest } from '.';

describe('sum function', () => {
  it('should sum', () => {
    expect(sumTest(1, 2)).toBe(3);
  });

  it('its correct', () => {
    expect(sumTest(0, 2)).toBe(2);
  });
});
