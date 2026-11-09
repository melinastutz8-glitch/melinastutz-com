// All-atom model of a B-DNA duplex for a given sequence, built with the rules
// of the Chandrasekaran & Arnott fiber model (src/data/bdnaFiber.ts):
//
// - Pair k of strand I is the template nucleotide moved by the helical screw
//   operation: rotate by k·36° about the z axis and shift by k·3.375 Å.
// - Its Watson–Crick partner on strand II is the dyad image (x, −y, −z) of
//   the template, moved by the same screw operation.
//
// Direction of the strands, derived from the bonds (tested in model.test.ts):
// strand I runs 5' → 3' towards decreasing k, strand II towards increasing k.
// Sequence position s (0 = the 5' end of strand I) therefore sits at k = −s.
// The model is centred on the middle of the helix axis. Units: Å.
import { BACKBONE, BASES, FIBER_RISE, FIBER_TWIST_DEG, SUGAR, type Vec3 } from '@/data/bdnaFiber';

export type Base = 'A' | 'C' | 'G' | 'T';
export type Strand = 1 | 2;

const PARTNER: Record<Base, Base> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const PURINES = new Set<Base>(['A', 'G']);

export interface Nucleotide {
  strand: Strand;
  /** Position along strand I, 0-based from its 5' end; both bases of a pair share it. */
  pos: number;
  base: Base;
  atoms: Record<string, Vec3>;
}

export interface HydrogenBond {
  a: Vec3;
  b: Vec3;
  pos: number;
}

export interface Duplex {
  sequence: string;
  nucleotides: Nucleotide[];
  hbonds: HydrogenBond[];
  /** Phosphorus atoms (drawn as spheres). */
  phosphates: { at: Vec3; strand: Strand; base: Base; pos: number }[];
  /** Strand ends for the 5′/3′ labels: the first P and the last O3' of each strand. */
  ends: { strand: Strand; prime: "5'" | "3'"; at: Vec3 }[];
}

const DEG = Math.PI / 180;

/** Helical screw operation: k steps of the fiber model. */
export function screw([x, y, z]: Vec3, k: number): Vec3 {
  const a = k * FIBER_TWIST_DEG * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z + k * FIBER_RISE];
}

/** The dyad: 180° rotation about the x axis, (r, φ, z) → (r, −φ, −z). */
export function dyad([x, y, z]: Vec3): Vec3 {
  return [x, -y, -z];
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Template nucleotide of strand I at k = 0, including its own O3'. */
function template(base: Base): Record<string, Vec3> {
  const atoms: Record<string, Vec3> = {};
  for (const [name, v] of Object.entries(BACKBONE)) if (name !== "O3'") atoms[name] = v;
  // The table's O3' is joined to this P; the O3' bonded to this C3' is one step back.
  atoms["O3'"] = screw(BACKBONE["O3'"], -1);
  Object.assign(atoms, SUGAR, BASES[base]);
  return atoms;
}

/** Watson–Crick hydrogen bonds, purine/pyrimidine atom first. */
export const WATSON_CRICK: Record<'AT' | 'GC', [string, string][]> = {
  AT: [
    ['N6', 'O4'],
    ['N1', 'N3'],
  ],
  GC: [
    ['O6', 'N4'],
    ['N1', 'N3'],
    ['N2', 'O2'],
  ],
};

function phosphatesOf(nucleotides: Nucleotide[]): Duplex['phosphates'] {
  return nucleotides.map((nt) => ({ at: nt.atoms.P, strand: nt.strand, base: nt.base, pos: nt.pos }));
}

export function buildDuplex(sequence: string): Duplex {
  const seq = sequence.toUpperCase().split('') as Base[];
  for (const b of seq) if (!(b in PARTNER)) throw new Error(`Not a DNA base: ${b}`);
  const n = seq.length;
  const zCentre = (-(n - 1) * FIBER_RISE) / 2;
  const place = (v: Vec3): Vec3 => [v[0], v[1], v[2] - zCentre];

  const nucleotides: Nucleotide[] = [];
  seq.forEach((base, pos) => {
    const k = -pos;
    const partner = PARTNER[base];
    const one: Record<string, Vec3> = {};
    for (const [name, v] of Object.entries(template(base))) one[name] = place(screw(v, k));
    const two: Record<string, Vec3> = {};
    for (const [name, v] of Object.entries(template(partner))) two[name] = place(screw(dyad(v), k));
    nucleotides.push({ strand: 1, pos, base, atoms: one }, { strand: 2, pos, base: partner, atoms: two });
  });

  const byStrandPos = (strand: Strand, pos: number) =>
    nucleotides.find((nt) => nt.strand === strand && nt.pos === pos);

  const phosphates: Duplex['phosphates'] = phosphatesOf(nucleotides);

  const hbonds: HydrogenBond[] = [];
  seq.forEach((base, pos) => {
    const one = byStrandPos(1, pos)!;
    const two = byStrandPos(2, pos)!;
    const purineFirst = PURINES.has(base) ? [one, two] : [two, one];
    const pairs = base === 'A' || base === 'T' ? WATSON_CRICK.AT : WATSON_CRICK.GC;
    for (const [pu, py] of pairs) hbonds.push({ a: purineFirst[0].atoms[pu], b: purineFirst[1].atoms[py], pos });
  });

  const ends: Duplex['ends'] = [
    { strand: 1, prime: "5'", at: byStrandPos(1, 0)!.atoms.P },
    { strand: 1, prime: "3'", at: byStrandPos(1, n - 1)!.atoms["O3'"] },
    { strand: 2, prime: "5'", at: byStrandPos(2, n - 1)!.atoms.P },
    { strand: 2, prime: "3'", at: byStrandPos(2, 0)!.atoms["O3'"] },
  ];

  return { sequence: seq.join(''), nucleotides, hbonds, phosphates, ends };
}
