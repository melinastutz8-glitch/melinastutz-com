import { describe, expect, it } from 'vitest';
import { buildDuplex } from './model';
import { fitGlow, glowFrame, SUBDIVISIONS, toGlowCamera, type GlowView } from './glow';

const duplex = buildDuplex('GATCACAGGTCTATCACCCTATTA');

describe('glow geometry', () => {
  it('keeps the camera a proper rotation with the extra roll (determinant +1)', () => {
    const view: GlowView = { spin: 0.7, tilt: 0.3, pitch: 0.1, roll: -0.5 };
    const e = [toGlowCamera([1, 0, 0], view), toGlowCamera([0, 1, 0], view), toGlowCamera([0, 0, 1], view)];
    const det =
      e[0][0] * (e[1][1] * e[2][2] - e[1][2] * e[2][1]) -
      e[1][0] * (e[0][1] * e[2][2] - e[0][2] * e[2][1]) +
      e[2][0] * (e[0][1] * e[1][2] - e[0][2] * e[1][1]);
    expect(det).toBeCloseTo(1, 9);
  });

  it('stays right-handed when rolled diagonally', () => {
    // Undo the roll on screen and apply the side-view rule: near strand parts
    // of a right-handed helix with a horizontal axis slope from top left to bottom right.
    const roll = -0.45;
    const view: GlowView = { spin: 0, tilt: 0, pitch: 0, roll };
    const place = fitGlow(duplex, view, 800, 500, 20);
    const frame = glowFrame(duplex, view, place);
    let checked = 0;
    for (const s of frame.strands) {
      for (let i = 0; i < s.length - 1; i++) {
        const [a, b] = [s[i], s[i + 1]];
        if (a.z < 6 || b.z < 6) continue;
        // Rotate the screen vector back by the roll (screen y points down).
        const dx = b.x - a.x;
        const dy = -(b.y - a.y);
        const ux = dx * Math.cos(-roll) - dy * Math.sin(-roll);
        const uy = dx * Math.sin(-roll) + dy * Math.cos(-roll);
        if (Math.abs(ux) < 1e-6) continue;
        expect(Math.sign(uy / ux)).toBe(-1);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('builds both backbones and one rung per base pair', () => {
    const view: GlowView = { spin: 0.2, tilt: 0.25, pitch: 0, roll: -0.3 };
    const frame = glowFrame(duplex, view, fitGlow(duplex, view, 600, 400, 24));
    expect(frame.strands).toHaveLength(2);
    expect(frame.strands[0]).toHaveLength(24 * SUBDIVISIONS + 1);
    expect(frame.rungs).toHaveLength(24);
    expect(frame.zMax).toBeGreaterThan(frame.zMin);
  });

  it('fits the helix inside the box at every spin angle', () => {
    const base: GlowView = { spin: 0, tilt: 0.25, pitch: 0, roll: -0.4 };
    const place = fitGlow(duplex, base, 600, 400, 24);
    for (let k = 0; k < 24; k++) {
      const frame = glowFrame(duplex, { ...base, spin: (k / 24) * 2 * Math.PI }, place);
      for (const s of frame.strands) for (const p of s) {
        expect(p.x).toBeGreaterThan(20);
        expect(p.x).toBeLessThan(580);
        expect(p.y).toBeGreaterThan(20);
        expect(p.y).toBeLessThan(380);
      }
    }
  });
});
