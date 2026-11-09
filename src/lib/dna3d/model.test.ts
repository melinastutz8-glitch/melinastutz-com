// Chemistry checks of the B-DNA model: if the fiber data or the symmetry
// rules were applied wrongly (wrong strand direction, mirrored helix, wrong
// partner), these distances would be far off.
import { describe, expect, it } from 'vitest';
import { BACKBONE, FIBER_RISE, FIBER_TWIST_DEG } from '@/data/bdnaFiber';
import { MTDNA_START } from '@/data/mtdna';
import { buildDuplex, distance, dyad, screw, type Nucleotide } from './model';

const duplex = buildDuplex(MTDNA_START);
const nt = (strand: 1 | 2, pos: number) =>
  duplex.nucleotides.find((n) => n.strand === strand && n.pos === pos) as Nucleotide;

describe('B-DNA fiber model', () => {
  it('uses the B-DNA helix of the source: 36° twist, 3.375 Å rise, P on a 9.2 Å radius', () => {
    expect(FIBER_TWIST_DEG).toBe(36);
    expect(FIBER_RISE).toBe(3.375);
    expect(Math.hypot(BACKBONE.P[0], BACKBONE.P[1])).toBeCloseTo(9.225, 2);
  });

  it('is a right-handed helix: along each strand the azimuth and the height turn the same way', () => {
    // Strand I, k = 0 → k = 1: φ grows by +36° while z grows by +3.375 Å.
    const p0 = screw(BACKBONE.P, 0);
    const p1 = screw(BACKBONE.P, 1);
    const turn = Math.atan2(p0[0] * p1[1] - p0[1] * p1[0], p0[0] * p1[0] + p0[1] * p1[1]);
    expect(turn).toBeGreaterThan(0);
    expect(p1[2] - p0[2]).toBeGreaterThan(0);
  });

  it('keeps the dyad an involution', () => {
    const v = [1.2, -3.4, 5.6] as const;
    expect(dyad(dyad(v))).toEqual([1.2, -3.4, 5.6]);
  });

  it('has the right covalent geometry inside every nucleotide', () => {
    for (const n of duplex.nucleotides) {
      const a = n.atoms;
      expect(distance(a.P, a["O5'"])).toBeCloseTo(1.6, 1);
      expect(distance(a["C3'"], a["O3'"])).toBeGreaterThan(1.35);
      expect(distance(a["C3'"], a["O3'"])).toBeLessThan(1.5);
      expect(distance(a["C1'"], a[n.base === 'A' || n.base === 'G' ? 'N9' : 'N1'])).toBeGreaterThan(1.4);
      expect(distance(a["C1'"], a[n.base === 'A' || n.base === 'G' ? 'N9' : 'N1'])).toBeLessThan(1.55);
    }
  });

  it("links O3' to the next P exactly in the 5' → 3' direction, antiparallel on the two strands", () => {
    const n = MTDNA_START.length;
    for (let pos = 0; pos < n - 1; pos++) {
      // Strand I: 5' → 3' with increasing position.
      expect(distance(nt(1, pos).atoms["O3'"], nt(1, pos + 1).atoms.P)).toBeCloseTo(1.6, 1);
      expect(distance(nt(1, pos + 1).atoms["O3'"], nt(1, pos).atoms.P)).toBeGreaterThan(4);
      // Strand II: 5' → 3' with decreasing position.
      expect(distance(nt(2, pos + 1).atoms["O3'"], nt(2, pos).atoms.P)).toBeCloseTo(1.6, 1);
      expect(distance(nt(2, pos).atoms["O3'"], nt(2, pos + 1).atoms.P)).toBeGreaterThan(4);
    }
  });

  it('pairs every base with its Watson–Crick partner at hydrogen-bond distance (2.6–3.2 Å)', () => {
    MTDNA_START.split('').forEach((base, pos) => {
      const partner = nt(2, pos).base;
      expect(`${base}${partner}`).toMatch(/^(AT|TA|GC|CG)$/);
    });
    const counts = { 2: 0, 3: 0 } as Record<number, number>;
    for (let pos = 0; pos < MTDNA_START.length; pos++) {
      const bonds = duplex.hbonds.filter((h) => h.pos === pos);
      counts[bonds.length] = (counts[bonds.length] ?? 0) + 1;
      for (const h of bonds) {
        const d = distance(h.a, h.b);
        expect(d).toBeGreaterThan(2.6);
        expect(d).toBeLessThan(3.2);
      }
    }
    const gc = MTDNA_START.split('').filter((b) => b === 'G' || b === 'C').length;
    expect(counts[3]).toBe(gc);
    expect(counts[2]).toBe(MTDNA_START.length - gc);
  });

  it('stacks neighbouring base pairs about 3.4 Å apart without clashes', () => {
    for (let pos = 0; pos < MTDNA_START.length - 1; pos++) {
      const dz = Math.abs(nt(1, pos).atoms.C4[2] - nt(1, pos + 1).atoms.C4[2]);
      expect(dz).toBeCloseTo(FIBER_RISE, 0);
    }
    // No two atoms of different nucleotides closer than 2.4 Å (except bonded O3'–P and H-bonds).
    const atoms = duplex.nucleotides.flatMap((n) => Object.values(n.atoms).map((v) => ({ n, v })));
    let closest = Infinity;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        if (atoms[i].n === atoms[j].n) continue;
        const d = distance(atoms[i].v, atoms[j].v);
        if (d > 1.7) closest = Math.min(closest, d);
      }
    }
    expect(closest).toBeGreaterThan(2.4);
  });

  it("labels the 5' end of strand I at position 1 and the strands' ends antiparallel", () => {
    const end = (strand: 1 | 2, prime: "5'" | "3'") => duplex.ends.find((e) => e.strand === strand && e.prime === prime)!.at;
    expect(end(1, "5'")).toEqual(nt(1, 0).atoms.P);
    expect(end(2, "5'")).toEqual(nt(2, MTDNA_START.length - 1).atoms.P);
    // Strand I's 5' end and strand II's 3' end lie at the same end of the helix.
    expect(Math.abs(end(1, "5'")[2] - end(2, "3'")[2])).toBeLessThan(6);
  });
});
