// Geometry of the turning DNA double helix (src/components/DnaHelix.tsx).
// Pure functions, no DOM: the server renders the first frame with them, and
// the browser recomputes the same paths for every animation frame.
//
// Side view of B-DNA: strand A sits at y = cy + amp·sin θ, strand B at
// y = cy + amp·sin(θ + GROOVE_OFFSET), and θ grows by one full turn every
// 10.5 base pairs. The two backbones are not opposite each other (that would
// be 180°): the offset makes the alternating minor and major grooves of real
// DNA. cos(angle) is a strand's depth; each strand is split into a back, a
// middle and a front band, drawn from faint and thin to strong and thick.
import { BASE_PAIRS_PER_TURN } from '@/data/mtdna';

export const HELIX = {
  /** Horizontal distance between base pairs, px (48 pairs fit the 1136 px column). */
  step: 22,
  /** Left and right margin for the 5′/3′ labels, px. */
  inset: 40,
  /** Total height, px (letters, helix, letters, position ruler). */
  height: 200,
  /** Vertical centre of the helix, px. */
  cy: 88,
  /** Radius of the helix in the side view, px. */
  amp: 42,
  /** Distance between path samples, px. */
  sample: 3,
} as const;

/** The minor groove spans about 36 % of a turn, the major groove the rest. */
export const GROOVE_OFFSET = 2 * Math.PI * 0.36;
/** Depth above which a strand counts as front, below its negative as back. */
const BAND = 0.35;

const TURN_PER_BP = (2 * Math.PI) / BASE_PAIRS_PER_TURN;

export function helixWidth(basePairs: number): number {
  return HELIX.inset * 2 + (basePairs - 1) * HELIX.step;
}

export function basePairX(i: number): number {
  return HELIX.inset + i * HELIX.step;
}

const angleAt = (x: number, phase: number) => phase + ((x - HELIX.inset) / HELIX.step) * TURN_PER_BP;
const fmt = (n: number) => n.toFixed(1);

export type Band = 'back' | 'mid' | 'front';
export type StrandPaths = Record<Band, string>;

const bandOf = (depth: number): Band => (depth > BAND ? 'front' : depth < -BAND ? 'back' : 'mid');

/**
 * SVG path data of one backbone, split by depth into back, middle and front
 * parts. `offset` is 0 for strand A and GROOVE_OFFSET for strand B.
 */
export function strandPaths(phase: number, offset: number, width: number): StrandPaths {
  const out: StrandPaths = { back: '', mid: '', front: '' };
  let prev: { x: number; y: number; band: Band } | null = null;
  for (let x = 0; x <= width + HELIX.sample; x += HELIX.sample) {
    const theta = angleAt(x, phase) + offset;
    const y = HELIX.cy + HELIX.amp * Math.sin(theta);
    const band = bandOf(Math.cos(theta));
    if (prev && prev.band === band) {
      out[band] += `L${fmt(x)} ${fmt(y)}`;
    } else if (prev) {
      // Start the new part at the previous point so the strand stays continuous.
      out[band] += `M${fmt(prev.x)} ${fmt(prev.y)}L${fmt(x)} ${fmt(y)}`;
    } else {
      out[band] += `M${fmt(x)} ${fmt(y)}`;
    }
    prev = { x, y, band };
  }
  return out;
}

/** The base-pair rung at position i: its end on each strand and its middle. */
export function rung(i: number, phase: number): { x: number; ya: number; yb: number; ym: number } {
  const x = basePairX(i);
  const theta = angleAt(x, phase);
  const ya = HELIX.cy + HELIX.amp * Math.sin(theta);
  const yb = HELIX.cy + HELIX.amp * Math.sin(theta + GROOVE_OFFSET);
  return { x, ya, yb, ym: (ya + yb) / 2 };
}

/** Positions shown on the ruler under the sequence: 1, 10, 20, … and the last one. */
export function rulerPositions(basePairs: number): number[] {
  const marks = [1];
  for (let p = 10; p < basePairs; p += 10) marks.push(p);
  if (marks[marks.length - 1] !== basePairs) marks.push(basePairs);
  return marks;
}

export { fmt as formatCoordinate };
