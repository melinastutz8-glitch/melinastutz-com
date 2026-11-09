import { describe, expect, it } from 'vitest';
import { isLocale, localePath } from './routing';

describe('localePath', () => {
  it('prefixes the locale and ends with exactly one slash', () => {
    expect(localePath('de', '/')).toBe('/de/');
    expect(localePath('en', '/cv')).toBe('/en/cv/');
    expect(localePath('en', '/cv/')).toBe('/en/cv/');
    expect(localePath('de', '/research//')).toBe('/de/research/');
  });
});

describe('isLocale', () => {
  it('accepts only the configured locales', () => {
    expect(isLocale('de')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
});
