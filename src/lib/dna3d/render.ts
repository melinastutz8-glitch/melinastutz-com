// Camera, projection and draw list for the 3D DNA model. Pure functions, no
// DOM, so the geometry is unit-tested (render.test.ts); the component only
// paints the list on a canvas.
//
// Representation (the "tube and ring" cartoon of molecular graphics programs
// such as ChimeraX): each backbone is a smooth tube through the real
// phosphorus positions, in 5' → 3' order (ending at the last O3'); each
// nucleotide hangs from it by sticks P–C4'–C1' and the glycosidic bond
// C1'–N9 (purines) or C1'–N1 (pyrimidines); each base is drawn as its filled
// ring(s) at the real atom positions with its exocyclic atoms; phosphorus
// atoms are small spheres; Watson–Crick hydrogen bonds are dashed.
//
// Coordinates:
// - Model space (Å): helix axis along +z, right-handed (src/lib/dna3d/model.ts).
// - Camera space: X right, Y up, Z towards the viewer (right-handed).
// - Screen: x right, y down.
// Every step from model to camera is a proper rotation (determinant +1), so
// the right-handed helix is never mirrored. Model −z (strand I's 5' → 3'
// direction) points to the right, so the sequence reads left to right.
import type { Vec3 } from '@/data/bdnaFiber';
import type { Base, Duplex, Nucleotide, Strand } from './model';

export interface View {
  /** Rotation about the helix axis, rad (the animation and horizontal drag). */
  spin: number;
  /** Turn of the axis about the vertical screen axis, so the bases show their faces, rad. */
  tilt: number;
  /** Look slightly from above or below, rad (vertical drag). */
  pitch: number;
}

export interface Viewport {
  /** Canvas centre, CSS px. */
  cx: number;
  cy: number;
  /** CSS px per Å at depth 0. */
  scale: number;
  /** Distance of the eye from the model centre, Å (perspective). */
  eye: number;
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

export interface ScreenPoint {
  x: number;
  y: number;
  /** Camera depth, larger is nearer. */
  z: number;
  /** Perspective factor, 1 at depth 0. */
  f: number;
}

export function project(c: Vec3, vp: Viewport): ScreenPoint {
  const f = vp.eye / (vp.eye - c[2]);
  return { x: vp.cx + c[0] * vp.scale * f, y: vp.cy - c[1] * vp.scale * f, z: c[2], f };
}

export type ColorKey = `strand${Strand}` | Base | 'P' | 'hbond';

export type Primitive =
  | { kind: 'tube'; z: number; points: ScreenPoint[]; width: number; color: ColorKey }
  | { kind: 'stick'; z: number; a: ScreenPoint; b: ScreenPoint; width: number; color: ColorKey }
  | { kind: 'hbond'; z: number; a: ScreenPoint; b: ScreenPoint; width: number; color: 'hbond' }
  | { kind: 'ring'; z: number; points: ScreenPoint[]; color: ColorKey; light: number }
  | { kind: 'atom'; z: number; c: ScreenPoint; r: number; color: 'P' };

/** Radii in Å, drawn with perspective. */
export const RADII = { tube: 1.05, sugar: 0.45, base: 0.32, hbond: 0.09, phosphorus: 0.85 } as const;
/** Tube pieces between two consecutive backbone points (P → P …). */
export const TUBE_SUBDIVISIONS = 10;
/** A joined tube piece spans at most this depth range (Å) and this many pieces. */
const TUBE_RUN_DEPTH = 2.6;
const TUBE_RUN_MAX = 40;

const PURINES = new Set<Base>(['A', 'G']);
const RING_6 = ['N1', 'C2', 'N3', 'C4', 'C5', 'C6'];
const RING_5 = ['C4', 'C5', 'N7', 'C8', 'N9'];
const EXOCYCLIC: Record<Base, [string, string][]> = {
  A: [['C6', 'N6']],
  G: [
    ['C6', 'O6'],
    ['C2', 'N2'],
  ],
  T: [
    ['C2', 'O2'],
    ['C4', 'O4'],
    ['C5', 'C7'],
  ],
  C: [
    ['C2', 'O2'],
    ['C4', 'N4'],
  ],
};

/** Backbone trace of one strand in 5' → 3' order: the P of every nucleotide, then the last O3'. */
export function backboneTrace(duplex: Duplex, strand: Strand): Vec3[] {
  const nts = duplex.nucleotides
    .filter((n) => n.strand === strand)
    .sort((a, b) => (strand === 1 ? a.pos - b.pos : b.pos - a.pos));
  return [...nts.map((n) => n.atoms.P), nts[nts.length - 1].atoms["O3'"]];
}

/** Centripetal-free uniform Catmull–Rom spline through the points (in camera space). */
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

/** Everything to paint, sorted from far to near (painter's algorithm). */
export function drawList(duplex: Duplex, view: View, vp: Viewport): Primitive[] {
  const cache = new Map<Vec3, { cam: Vec3; p: ScreenPoint }>();
  const at = (v: Vec3) => {
    let hit = cache.get(v);
    if (!hit) {
      const cam = toCamera(v, view);
      hit = { cam, p: project(cam, vp) };
      cache.set(v, hit);
    }
    return hit;
  };
  const list: Primitive[] = [];
  const stick = (a: Vec3, b: Vec3, radius: number, color: ColorKey) => {
    const A = at(a);
    const B = at(b);
    list.push({ kind: 'stick', z: (A.cam[2] + B.cam[2]) / 2, a: A.p, b: B.p, width: 2 * radius * vp.scale * ((A.p.f + B.p.f) / 2), color });
  };

  // Backbone tubes, smoothed in camera space. Consecutive pieces at nearly the
  // same depth are joined into one polyline, so the tube has no visible
  // joints; where the depth changes (the tube turning towards or away from
  // the viewer) a new piece starts, so near and far parts still overlap
  // correctly.
  for (const strand of [1, 2] as const) {
    const cams = catmullRom(backboneTrace(duplex, strand).map((v) => toCamera(v, view)), TUBE_SUBDIVISIONS);
    const pts = cams.map((c) => project(c, vp));
    let start = 0;
    while (start < pts.length - 1) {
      let end = start + 1;
      while (end < pts.length - 1 && Math.abs(cams[end + 1][2] - cams[start][2]) < TUBE_RUN_DEPTH && end - start < TUBE_RUN_MAX) end++;
      const run = pts.slice(start, end + 1);
      const z = cams.slice(start, end + 1).reduce((sum, c) => sum + c[2], 0) / run.length;
      const f = run.reduce((sum, p) => sum + p.f, 0) / run.length;
      list.push({ kind: 'tube', z, points: run, width: 2 * RADII.tube * vp.scale * f, color: `strand${strand}` });
      start = end;
    }
  }

  for (const n of duplex.nucleotides) addNucleotide(n);

  function addNucleotide(n: Nucleotide) {
    const a = n.atoms;
    const purine = PURINES.has(n.base);
    stick(a.P, a["C4'"], RADII.sugar, `strand${n.strand}`);
    stick(a["C4'"], a["C1'"], RADII.sugar, `strand${n.strand}`);
    stick(a["C1'"], a[purine ? 'N9' : 'N1'], RADII.sugar, `strand${n.strand}`);
    for (const ring of purine ? [RING_6, RING_5] : [RING_6]) {
      const pts = ring.map((name) => at(a[name]));
      list.push({
        kind: 'ring',
        z: pts.reduce((s, p) => s + p.cam[2], 0) / pts.length,
        points: pts.map((p) => p.p),
        color: n.base,
        light: facing(pts.map((p) => p.cam)),
      });
    }
    for (const [x, y] of EXOCYCLIC[n.base]) stick(a[x], a[y], RADII.base, n.base);
    const P = at(a.P);
    list.push({ kind: 'atom', z: P.cam[2] + 0.01, c: P.p, r: RADII.phosphorus * vp.scale * P.p.f, color: 'P' });
  }

  for (const h of duplex.hbonds) {
    const A = at(h.a);
    const B = at(h.b);
    list.push({
      kind: 'hbond',
      z: (A.cam[2] + B.cam[2]) / 2,
      a: A.p,
      b: B.p,
      width: Math.max(1, 2 * RADII.hbond * vp.scale * ((A.p.f + B.p.f) / 2)),
      color: 'hbond',
    });
  }
  return list.sort((m, k) => m.z - k.z);
}

/** How much a ring faces the viewer: |normal · view direction|, 0 (edge-on) to 1. */
export function facing(points: Vec3[]): number {
  const [p0, p1, p2] = points;
  const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  return Math.abs(n[2] / len);
}

/** Fits the helix into a canvas: scale so the full length and diameter fit, with margins. */
export function fitViewport(width: number, height: number, basePairs: number, view: View): Viewport {
  const rise = 3.375;
  const length = (basePairs - 1) * rise + 6;
  const diameter = 24;
  const across = length * Math.cos(view.tilt) + diameter * Math.abs(Math.sin(view.tilt));
  const marginX = 36;
  const marginY = 16;
  const eye = Math.max(220, length * 2.6);
  // The near end is magnified by the perspective; leave room for it.
  const nearGain = eye / (eye - (length / 2) * Math.abs(Math.sin(view.tilt)));
  const scale = Math.min((width - 2 * marginX) / (across * nearGain), (height - 2 * marginY) / (diameter * 1.1 * nearGain));
  return { cx: width / 2, cy: height / 2, scale, eye };
}
