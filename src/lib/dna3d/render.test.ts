// Camera and backbone checks. The most important one: the camera only
// rotates, so the right-handed helix is never mirrored (a left-handed DNA is
// the classic mistake in DNA illustrations).
import { describe, expect, it } from 'vitest';
import type { Vec3 } from '@/data/bdnaFiber';
import { MTDNA_START } from '@/data/mtdna';
import { buildDuplex } from './model';
import { backboneTrace, catmullRom, toCamera, type View } from './render';

const duplex = buildDuplex(MTDNA_START);
const straight: View = { spin: 0, tilt: 0, pitch: 0 };

function det(view: View): number {
  const ex = toCamera([1, 0, 0], view);
  const ey = toCamera([0, 1, 0], view);
  const ez = toCamera([0, 0, 1], view);
  return (
    ex[0] * (ey[1] * ez[2] - ey[2] * ez[1]) - ey[0] * (ex[1] * ez[2] - ex[2] * ez[1]) + ez[0] * (ex[1] * ey[2] - ex[2] * ey[1])
  );
}

describe('camera', () => {
  it('only rotates (determinant +1, lengths kept), so nothing is mirrored', () => {
    for (const view of [straight, { spin: 1.1, tilt: 0.4, pitch: -0.3 }, { spin: -2.5, tilt: -0.6, pitch: 0.7 }]) {
      expect(det(view)).toBeCloseTo(1, 9);
      const v: Vec3 = [3, -4, 12];
      expect(Math.hypot(...toCamera(v, view))).toBeCloseTo(13, 9);
    }
  });

  it('puts position 1 on the left and the last position on the right', () => {
    const first = toCamera(duplex.nucleotides.find((n) => n.strand === 1 && n.pos === 0)!.atoms.C4, straight);
    const last = toCamera(duplex.nucleotides.find((n) => n.strand === 1 && n.pos === 47)!.atoms.C4, straight);
    expect(first[0]).toBeLessThan(last[0]);
  });

  it('shows a right-handed helix: with the axis horizontal, near strand parts run from top left to bottom right', () => {
    // In camera space (Y up) the near segments of a right-handed helix with a
    // horizontal axis have a negative slope ("\").
    for (const strand of [1, 2] as const) {
      const ps = duplex.nucleotides
        .filter((n) => n.strand === strand)
        .sort((a, b) => a.pos - b.pos)
        .map((n) => toCamera(n.atoms.P, straight));
      let checked = 0;
      for (let i = 0; i < ps.length - 1; i++) {
        const [a, b] = [ps[i], ps[i + 1]];
        if (a[2] > 6 && b[2] > 6) {
          expect(Math.sign((b[1] - a[1]) / (b[0] - a[0]))).toBe(-1);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(5);
    }
  });
});

describe('backbone', () => {
  it("runs through the real phosphorus atoms in 5' → 3' order on both strands", () => {
    const one = backboneTrace(duplex, 1);
    expect(one).toHaveLength(48 + 1);
    expect(one[0]).toEqual(duplex.nucleotides.find((n) => n.strand === 1 && n.pos === 0)!.atoms.P);
    // Strand II starts at its own 5' end, at the last position of strand I.
    expect(backboneTrace(duplex, 2)[0]).toEqual(duplex.nucleotides.find((n) => n.strand === 2 && n.pos === 47)!.atoms.P);
  });

  it('smooths through every control point exactly', () => {
    const trace = backboneTrace(duplex, 1);
    const smooth = catmullRom(trace, 10);
    trace.forEach((p, i) => expect(smooth[i * 10]).toEqual(p));
  });
});
