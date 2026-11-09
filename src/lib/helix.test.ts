import { describe, expect, it } from 'vitest';
import { basePairX, GROOVE_OFFSET, HELIX, helixWidth, rulerPositions, rung, strandPaths } from './helix';

describe('helix geometry', () => {
  it('spaces base pairs evenly between the two insets', () => {
    expect(basePairX(0)).toBe(HELIX.inset);
    expect(helixWidth(48)).toBe(HELIX.inset * 2 + 47 * HELIX.step);
  });

  it('offsets the strands to form a minor and a major groove, not a symmetric ladder', () => {
    expect(GROOVE_OFFSET).toBeGreaterThan(Math.PI * 0.6);
    expect(GROOVE_OFFSET).toBeLessThan(Math.PI * 0.8);
  });

  it('keeps both rung ends within the helix radius and the middle between them', () => {
    for (let i = 0; i < 48; i++) {
      const { ya, yb, ym } = rung(i, 0.7);
      for (const y of [ya, yb]) expect(Math.abs(y - HELIX.cy)).toBeLessThanOrEqual(HELIX.amp + 1e-9);
      expect(ym).toBeCloseTo((ya + yb) / 2, 9);
    }
  });

  it('repeats after one full turn of the phase', () => {
    expect(rung(5, 0.3).ya).toBeCloseTo(rung(5, 0.3 + 2 * Math.PI).ya, 6);
  });

  it('splits each strand into depth bands that together cover the width', () => {
    const width = helixWidth(48);
    for (const offset of [0, GROOVE_OFFSET]) {
      const paths = strandPaths(0, offset, width);
      for (const band of ['back', 'mid', 'front'] as const) expect(paths[band].startsWith('M')).toBe(true);
      const xs =
        Object.values(paths)
          .join('')
          .match(/[ML]([\d.]+) /g)
          ?.map((t) => Number(t.slice(1))) ?? [];
      expect(Math.min(...xs)).toBe(0);
      expect(Math.max(...xs)).toBeGreaterThanOrEqual(width);
    }
  });

  it('is deterministic, so the server render matches the first client render', () => {
    expect(strandPaths(0, GROOVE_OFFSET, 400)).toEqual(strandPaths(0, GROOVE_OFFSET, 400));
  });

  it('marks 1, every tenth position and the last one on the ruler', () => {
    expect(rulerPositions(48)).toEqual([1, 10, 20, 30, 40, 48]);
    expect(rulerPositions(40)).toEqual([1, 10, 20, 30, 40]);
  });
});
