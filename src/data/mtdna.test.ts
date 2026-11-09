import { describe, expect, it } from 'vitest';
import { complement, MTDNA_SOURCE, MTDNA_START } from './mtdna';

describe('mtDNA start', () => {
  it('is the first 48 bases of the rCRS (NC_012920.1)', () => {
    expect(MTDNA_START).toHaveLength(48);
    expect(MTDNA_START).toMatch(/^[ACGT]+$/);
    // The well-known opening of the human mitochondrial reference sequence.
    expect(MTDNA_START.startsWith('GATCACAGGTCTATCACCC')).toBe(true);
    expect(MTDNA_SOURCE).toEqual({ accession: 'NC_012920.1', name: 'rCRS', length: 16569 });
  });

  it('pairs A with T and G with C', () => {
    expect(complement('GATC')).toBe('CTAG');
    expect(complement(complement(MTDNA_START))).toBe(MTDNA_START);
    expect(() => complement('GAXC')).toThrow();
  });

});
