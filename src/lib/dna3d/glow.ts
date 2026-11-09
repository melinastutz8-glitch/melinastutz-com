// Geometry for the glowing DNA eye-catcher (src/components/DnaGlow.tsx).
// Pure functions, no DOM. The shape is the real B-DNA of the fiber model
// (src/lib/dna3d/model.ts): two backbones through the phosphorus atoms and,
// for every base pair, a rung between the C4' atoms of the two nucleotides.
// The camera (src/lib/dna3d/render.ts) adds one more proper rotation, a roll
// in the screen plane, so the helix can lie diagonally; nothing is mirrored,
// the helix stays right-handed (tested in glow.test.ts).
import type { Vec3 } from '@/data/bdnaFiber';
import type { Duplex } from './model';
import { backboneTrace, catmullRom, toCamera, type View } from './render';

export interface GlowView extends View {
  /** Rotation in the screen plane, rad (positive turns counter-clockwise). */
  roll: number;
}

export function toGlowCamera(v: Vec3, view: GlowView): Vec3 {
  const [x, y, z] = toCamera(v, view);
  const c = Math.cos(view.roll);
  const s = Math.sin(view.roll);
  return [x * c - y * s, x * s + y * c, z];
}

export interface Placement {
  /** Centre of the helix on the canvas, CSS px. */
  cx: number;
  cy: number;
  /** CSS px per Å. */
  scale: number;
  /** Eye distance, Å (perspective). */
  eye: number;
}

export interface GlowPoint {
  x: number;
  y: number;
  /** Camera depth, Å, larger is nearer. */
  z: number;
  /** Perspective factor, 1 at depth 0. */
  f: number;
}

export interface GlowFrame {
  /** Smoothed backbone of each strand. */
  strands: GlowPoint[][];
  /** One rung per base pair, from strand I to strand II. */
  rungs: { a: GlowPoint; b: GlowPoint }[];
  /** Depth range of the frame, for depth cueing. */
  zMin: number;
  zMax: number;
}

export const SUBDIVISIONS = 10;

function project(c: Vec3, p: Placement): GlowPoint {
  const f = p.eye / (p.eye - c[2]);
  return { x: p.cx + c[0] * p.scale * f, y: p.cy - c[1] * p.scale * f, z: c[2], f };
}

export function glowFrame(duplex: Duplex, view: GlowView, place: Placement): GlowFrame {
  const strands = ([1, 2] as const).map((strand) =>
    catmullRom(backboneTrace(duplex, strand).map((v) => toGlowCamera(v, view)), SUBDIVISIONS).map((c) => project(c, place)),
  );
  const rungs = Array.from({ length: duplex.sequence.length }, (_, pos) => {
    const one = duplex.nucleotides.find((n) => n.strand === 1 && n.pos === pos)!;
    const two = duplex.nucleotides.find((n) => n.strand === 2 && n.pos === pos)!;
    return {
      a: project(toGlowCamera(one.atoms["C4'"], view), place),
      b: project(toGlowCamera(two.atoms["C4'"], view), place),
    };
  });
  let zMin = Infinity;
  let zMax = -Infinity;
  for (const s of strands) for (const p of s) {
    zMin = Math.min(zMin, p.z);
    zMax = Math.max(zMax, p.z);
  }
  return { strands, rungs, zMin, zMax };
}

/**
 * Scale and centre so the helix fits the box (with a margin) at every spin
 * angle, so it never touches the edges while it turns.
 */
export function fitGlow(duplex: Duplex, view: GlowView, width: number, height: number, margin: number): Placement {
  const eye = 600;
  const probe: Placement = { cx: 0, cy: 0, scale: 1, eye };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let k = 0; k < 12; k++) {
    const frame = glowFrame(duplex, { ...view, spin: (k / 12) * 2 * Math.PI }, probe);
    for (const s of frame.strands) for (const p of s) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  const scale = Math.min((width - 2 * margin) / (maxX - minX), (height - 2 * margin) / (maxY - minY));
  return {
    cx: width / 2 - ((minX + maxX) / 2) * scale,
    cy: height / 2 - ((minY + maxY) / 2) * scale,
    scale,
    eye,
  };
}
