// Geometry of the turning DNA double helix (src/components/DnaHelix.tsx).
// Pure functions, no DOM: the server renders the first frame with them, and
// the browser recomputes the same paths for every animation frame.
//
// Strand A sits at y = cy + amp·sin θ, strand B at y = cy − amp·sin θ, where
// θ grows by one full turn every 10.5 base pairs (B-DNA). cos θ tells which
// strand is in front: a strand's front part is drawn strong, its back part
// faint, so the two backbones read as a helix turning in depth.
import { BASE_PAIRS_PER_TURN } from '@/data/mtdna';

export const HELIX = {
  /** Horizontal distance between base pairs, px. */
  step: 24,
  /** Left and right margin for the 5′/3′ labels, px. */
  inset: 40,
  /** Total height, px. */
  height: 168,
  /** Vertical centre of the helix, px. */
  cy: 84,
  /** Half the distance between the strands, px. */
  amp: 40,
  /** Distance between path samples, px. */
  sample: 4,
} as const;

const TURN_PER_BP = (2 * Math.PI) / BASE_PAIRS_PER_TURN;

export function helixWidth(basePairs: number): number {
  return HELIX.inset * 2 + (basePairs - 1) * HELIX.step;
}

export function basePairX(i: number): number {
  return HELIX.inset + i * HELIX.step;
}

const angleAt = (x: number, phase: number) => phase + ((x - HELIX.inset) / HELIX.step) * TURN_PER_BP;
const fmt = (n: number) => n.toFixed(1);

export interface StrandPaths {
  front: string;
  back: string;
}

/**
 * SVG path data of one backbone, split into its front and back parts.
 * `sign` is +1 for strand A and −1 for strand B.
 */
export function strandPaths(phase: number, sign: 1 | -1, width: number): StrandPaths {
  let front = '';
  let back = '';
  let prev: { x: number; y: number; isFront: boolean } | null = null;
  for (let x = 0; x <= width; x += HELIX.sample) {
    const theta = angleAt(x, phase);
    const y = HELIX.cy + sign * HELIX.amp * Math.sin(theta);
    const isFront = sign * Math.cos(theta) >= 0;
    let segment: string;
    if (prev && prev.isFront === isFront) {
      segment = `L${fmt(x)} ${fmt(y)}`;
    } else if (prev) {
      // Start the new part at the previous point so the strand stays continuous.
      segment = `M${fmt(prev.x)} ${fmt(prev.y)}L${fmt(x)} ${fmt(y)}`;
    } else {
      segment = `M${fmt(x)} ${fmt(y)}`;
    }
    if (isFront) front += segment;
    else back += segment;
    prev = { x, y, isFront };
  }
  return { front, back };
}

/** End points of the base-pair rung at position i. */
export function rung(i: number, phase: number): { x: number; ya: number; yb: number } {
  const x = basePairX(i);
  const s = Math.sin(angleAt(x, phase));
  return { x, ya: HELIX.cy + HELIX.amp * s, yb: HELIX.cy - HELIX.amp * s };
}

export { fmt as formatCoordinate };
