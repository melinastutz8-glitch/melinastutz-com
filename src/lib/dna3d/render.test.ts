// Geometry checks of the 3D view. The most important one: the helix on screen
// must stay right-handed (a mirrored, left-handed DNA is the classic mistake
// in DNA illustrations).
import { describe, expect, it } from 'vitest';
import type { Vec3 } from '@/data/bdnaFiber';
import { MTDNA_START } from '@/data/mtdna';
import { buildDuplex } from './model';
import { backboneTrace, catmullRom, drawList, facing, fitViewport, project, toCamera, TUBE_SUBDIVISIONS, type View } from './render';

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
      const c = toCamera(v, view);
      expect(Math.hypot(...c)).toBeCloseTo(13, 9);
    }
  });

  it('shows the sequence left to right: position 1 on the left, the last position on the right', () => {
    const first = toCamera(duplex.nucleotides.find((n) => n.strand === 1 && n.pos === 0)!.atoms.C4, straight);
    const last = toCamera(duplex.nucleotides.find((n) => n.strand === 1 && n.pos === 47)!.atoms.C4, straight);
    expect(first[0]).toBeLessThan(last[0]);
  });

  it('draws a right-handed helix: with the axis horizontal, the near parts of a strand run from top left to bottom right', () => {
    // A right-handed helix seen from the side with a horizontal axis: the strand
    // segments facing the viewer slope downwards to the right ("\"), on screen
    // y grows downwards, so the screen slope is positive.
    const vp = fitViewport(1200, 260, 48, straight);
    for (const strand of [1, 2] as const) {
      const ps = duplex.nucleotides
        .filter((n) => n.strand === strand)
        .sort((a, b) => a.pos - b.pos)
        .map((n) => toCamera(n.atoms.P, straight));
      let checked = 0;
      for (let i = 0; i < ps.length - 1; i++) {
        const [a, b] = [ps[i], ps[i + 1]];
        if (a[2] > 6 && b[2] > 6) {
          const A = project(a, vp);
          const B = project(b, vp);
          expect(Math.sign((B.y - A.y) / (B.x - A.x))).toBe(1);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(5);
    }
  });
});

describe('draw list', () => {
  const view: View = { spin: 0.3, tilt: 0.42, pitch: 0 };
  const vp = fitViewport(1200, 260, 48, view);
  const list = drawList(duplex, view, vp);

  it('is sorted from far to near', () => {
    for (let i = 1; i < list.length; i++) expect(list[i].z).toBeGreaterThanOrEqual(list[i - 1].z);
  });

  it('contains both backbone tubes, every base ring, phosphorus atom and hydrogen bond', () => {
    const n = 48;
    // The tube pieces together cover every spline interval of both strands exactly once.
    const tubes = list.filter((p) => p.kind === 'tube');
    const intervals = tubes.reduce((s, p) => s + (p.kind === 'tube' ? p.points.length - 1 : 0), 0);
    expect(intervals).toBe(2 * n * TUBE_SUBDIVISIONS);
    expect(list.filter((p) => p.kind === 'atom')).toHaveLength(2 * n);
    const purines = duplex.nucleotides.filter((nt) => nt.base === 'A' || nt.base === 'G').length;
    expect(list.filter((p) => p.kind === 'ring')).toHaveLength(2 * n + purines);
    expect(list.filter((p) => p.kind === 'hbond')).toHaveLength(duplex.hbonds.length);
  });

  it("runs each tube through the real phosphorus atoms in 5' → 3' order", () => {
    const trace = backboneTrace(duplex, 1);
    expect(trace).toHaveLength(48 + 1);
    expect(trace[0]).toEqual(duplex.nucleotides.find((nt) => nt.strand === 1 && nt.pos === 0)!.atoms.P);
    const smooth = catmullRom(trace, TUBE_SUBDIVISIONS);
    // The spline passes exactly through every control point.
    trace.forEach((p, i) => expect(smooth[i * TUBE_SUBDIVISIONS]).toEqual(p));
    // Strand II starts at its own 5' end, the last position of strand I.
    expect(backboneTrace(duplex, 2)[0]).toEqual(duplex.nucleotides.find((nt) => nt.strand === 2 && nt.pos === 47)!.atoms.P);
  });

  it('keeps the whole helix inside the canvas', () => {
    for (const p of list) {
      const pts = p.kind === 'ring' || p.kind === 'tube' ? p.points : p.kind === 'atom' ? [p.c] : [p.a, p.b];
      for (const q of pts) {
        expect(q.x).toBeGreaterThan(0);
        expect(q.x).toBeLessThan(1200);
        expect(q.y).toBeGreaterThan(0);
        expect(q.y).toBeLessThan(260);
      }
    }
  });

  it('shows the bases partly face-on in the default view, not edge-on', () => {
    const rings = list.filter((p) => p.kind === 'ring');
    const mean = rings.reduce((s, r) => s + (r.kind === 'ring' ? r.light : 0), 0) / rings.length;
    expect(mean).toBeGreaterThan(0.3);
  });

  it('rates edge-on rings 0 and rings facing the viewer 1', () => {
    expect(facing([[0, 0, 0], [1, 0, 0], [0, 1, 0]])).toBeCloseTo(1, 9);
    expect(facing([[0, 0, 0], [1, 0, 0], [0, 0, 1]])).toBeCloseTo(0, 9);
  });
});
