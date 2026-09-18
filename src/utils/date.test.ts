import { ensureEpoch, getEpochTime } from './date';

describe('date utils', () => {
  const date = new Date('2024-01-01T00:00:00.999Z');

  it('should convert a Date to epoch seconds', () => {
    expect(getEpochTime(date)).toBe(1704067200);
  });

  it('should ensure Date values are epoch seconds', () => {
    expect(ensureEpoch(date)).toBe(1704067200);
  });

  it('should preserve numeric epoch values', () => {
    expect(ensureEpoch(1704067200)).toBe(1704067200);
  });
});
