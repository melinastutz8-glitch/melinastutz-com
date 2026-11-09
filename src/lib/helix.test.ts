import { describe, expect, it } from 'vitest';
import { basePairX, HELIX, helixWidth, rung, strandPaths } from './helix';

describe('helix geometry', () => {
  it('spaces base pairs evenly between the two insets', () => {
    expect(basePairX(0)).toBe(HELIX.inset);
    expect(helixWidth(48)).toBe(HELIX.inset * 2 + 47 * HELIX.step);
  });

  it('puts the two strands of a rung symmetric around the centre and within the amplitude', () => {
    for (let i = 0; i < 48; i++) {
      const { ya, yb } = rung(i, 0.7);
      expect(ya + yb).toBeCloseTo(2 * HELIX.cy, 6);
      expect(Math.abs(ya - HELIX.cy)).toBeLessThanOrEqual(HELIX.amp + 1e-9);
    }
  });

  it('repeats after one full turn of the phase', () => {
    expect(rung(5, 0.3).ya).toBeCloseTo(rung(5, 0.3 + 2 * Math.PI).ya, 6);
  });

  it('splits each strand into front and back parts that together cover the width', () => {
    const width = helixWidth(48);
    for (const sign of [1, -1] as const) {
      const { front, back } = strandPaths(0, sign, width);
      expect(front.startsWith('M')).toBe(true);
      expect(back.startsWith('M')).toBe(true);
      const xs = `${front}${back}`.match(/[ML]([\d.]+) /g)?.map((t) => Number(t.slice(1))) ?? [];
      expect(Math.min(...xs)).toBe(0);
      expect(Math.max(...xs)).toBeGreaterThan(width - HELIX.sample);
    }
  });

  it('is deterministic, so the server render matches the first client render', () => {
    expect(strandPaths(0, 1, 400)).toEqual(strandPaths(0, 1, 400));
  });
});
