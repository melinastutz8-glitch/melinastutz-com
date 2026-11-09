import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contactEmailAddress, contactMailtoHref } from './contact-email';

// The expected address, built the same indirect way so the literal never
// appears in the repository (CI greps the build output for it).
const expected = ['info', 'melinastutz', 'com'].reduce((acc, part, i) => (i === 0 ? part : i === 1 ? `${acc}@${part}` : `${acc}.${part}`), '');

describe('contact e-mail', () => {
  it('assembles the address', () => {
    expect(contactEmailAddress()).toBe(expected);
  });

  it('builds a mailto link with an encoded subject', () => {
    expect(contactMailtoHref()).toBe(`mailto:${expected}`);
    expect(contactMailtoHref('PhD position')).toBe(`mailto:${expected}?subject=PhD%20position`);
  });

  it('does not carry the address as one string in its own source', () => {
    const source = readFileSync(fileURLToPath(new URL('./contact-email.ts', import.meta.url)), 'utf8');
    expect(source).not.toContain(expected);
  });
});
