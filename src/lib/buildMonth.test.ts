import { describe, expect, it } from 'vitest';
import { buildMonth } from './buildMonth';

describe('buildMonth', () => {
  it('formats the month as YYYY-MM', () => {
    expect(buildMonth(new Date('2026-11-08T12:00:00Z'))).toBe('2026-11');
  });

  it('uses the Swiss calendar at a month boundary', () => {
    // 23:30 UTC on 31 October is already 1 November in Zurich (UTC+1).
    expect(buildMonth(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11');
  });
});
