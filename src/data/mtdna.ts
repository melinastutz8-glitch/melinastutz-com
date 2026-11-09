// The start of the human mitochondrial genome, shown as the turning double
// helix on the research page. Source: NCBI RefSeq NC_012920.1, the revised
// Cambridge Reference Sequence (rCRS), "Homo sapiens mitochondrion, complete
// genome", 16,569 bp (efetch seq_start=1 seq_stop=48, checked 2026-11-09).
export const MTDNA_SOURCE = {
  accession: 'NC_012920.1',
  name: 'rCRS',
  length: 16569,
} as const;

/** Positions 1–48 of the rCRS, 5' → 3'. */
export const MTDNA_START = 'GATCACAGGTCTATCACCCTATTAACCACTCACGGGAGCTCTCCATGC';

/** B-DNA makes one full turn every 10.5 base pairs. */
export const BASE_PAIRS_PER_TURN = 10.5;

const PAIRS: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };

/** Watson–Crick partner of each base, read position by position. */
export function complement(sequence: string): string {
  return sequence
    .split('')
    .map((base) => {
      const partner = PAIRS[base];
      if (!partner) throw new Error(`Not a DNA base: ${base}`);
      return partner;
    })
    .join('');
}
