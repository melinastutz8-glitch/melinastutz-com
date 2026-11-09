// Camera and backbone helpers for the 3D DNA (used by src/lib/dna3d/glow.ts).
// Pure functions, no DOM; unit-tested in render.test.ts.
//
// Coordinates:
// - Model space (Å): helix axis along +z, right-handed (src/lib/dna3d/model.ts).
// - Camera space: X right, Y up, Z towards the viewer (right-handed).
// - Screen: x right, y down.
// Every step from model to camera is a proper rotation (determinant +1), so
// the right-handed helix is never mirrored. Model −z (strand I's 5' → 3'
// direction) points to the right.
import type { Vec3 } from '@/data/bdnaFiber';
import type { Duplex, Strand } from './model';

export interface View {
  /** Rotation about the helix axis, rad (the animation). */
  spin: number;
  /** Turn of the axis about the vertical screen axis, rad. */
  tilt: number;
  /** Look slightly from above or below, rad. */
  pitch: number;
}

export function toCamera([x, y, z]: Vec3, view: View): Vec3 {
  // 1. Spin about the helix axis.
  const cs = Math.cos(view.spin);
  const ss = Math.sin(view.spin);
  const xs = x * cs - y * ss;
  const ys = x * ss + y * cs;
  // 2. Axis to screen: X = −z, Y = x, Z = −y (a proper rotation).
  const X0 = -z;
  const Y0 = xs;
  const Z0 = -ys;
  // 3. Tilt about the vertical camera axis.
  const ct = Math.cos(view.tilt);
  const st = Math.sin(view.tilt);
  const X1 = X0 * ct + Z0 * st;
  const Z1 = -X0 * st + Z0 * ct;
  // 4. Pitch about the horizontal camera axis.
  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);
  return [X1, Y0 * cp - Z1 * sp, Y0 * sp + Z1 * cp];
}

/** Backbone trace of one strand in 5' → 3' order: the P of every nucleotide, then the last O3'. */
export function backboneTrace(duplex: Duplex, strand: Strand): Vec3[] {
  const nts = duplex.nucleotides
    .filter((n) => n.strand === strand)
    .sort((a, b) => (strand === 1 ? a.pos - b.pos : b.pos - a.pos));
  return [...nts.map((n) => n.atoms.P), nts[nts.length - 1].atoms["O3'"]];
}

/** Uniform Catmull–Rom spline through the points; passes exactly through every point. */
export function catmullRom(points: Vec3[], subdivisions: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        [0, 1, 2].map(
          (k) =>
            0.5 *
            (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
        ) as unknown as Vec3,
      );
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
