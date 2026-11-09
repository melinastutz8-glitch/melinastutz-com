import { describe, expect, it } from 'vitest';
import de from './messages/de.json';
import en from './messages/en.json';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

function values(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((v) => (v && typeof v === 'object' ? values(v as Record<string, unknown>) : [String(v)]));
}

describe('messages', () => {
  it('has the same keys in German and English', () => {
    expect(keys(en).sort()).toEqual(keys(de).sort());
  });

  it('has no empty strings', () => {
    for (const v of [...values(de), ...values(en)]) expect(v.trim().length).toBeGreaterThan(0);
  });

  it('uses Swiss German spelling (no ß)', () => {
    for (const v of values(de)) expect(v, v).not.toContain('ß');
  });

  it('never spells out the contact address', () => {
    for (const v of [...values(de), ...values(en)]) expect(v).not.toMatch(/info\s*(@|\[at\])\s*melinastutz/i);
  });
});
