import { describe, expect, it } from 'vitest';
import { buildPageMetadata, languageAlternates, localizedUrl, ownerTitle } from './metadata';

const base = { title: 'Werdegang | Melina Stutz', description: 'Kurzbeschreibung.' };

describe('localizedUrl', () => {
  it('prefixes every locale and always ends with a slash', () => {
    expect(localizedUrl('de', '/')).toBe('https://melinastutz.com/de/');
    expect(localizedUrl('en', '/')).toBe('https://melinastutz.com/en/');
    expect(localizedUrl('en', '/cv')).toBe('https://melinastutz.com/en/cv/');
    expect(localizedUrl('de', '/cv/')).toBe('https://melinastutz.com/de/cv/');
  });
});

describe('languageAlternates', () => {
  it('lists every locale and points x-default at the German page', () => {
    expect(languageAlternates('/research')).toEqual({
      de: 'https://melinastutz.com/de/research/',
      en: 'https://melinastutz.com/en/research/',
      'x-default': 'https://melinastutz.com/de/research/',
    });
  });
});

describe('buildPageMetadata', () => {
  it('sets a self-referencing canonical for each locale', () => {
    expect(buildPageMetadata({ ...base, locale: 'de', href: '/cv' }).alternates?.canonical).toBe(
      'https://melinastutz.com/de/cv/',
    );
    expect(buildPageMetadata({ ...base, locale: 'en', href: '/' }).alternates?.canonical).toBe(
      'https://melinastutz.com/en/',
    );
  });

  it('adds the language alternates of the same page', () => {
    const meta = buildPageMetadata({ ...base, locale: 'en', href: '/contact' });
    expect(meta.alternates?.languages).toEqual(languageAlternates('/contact'));
  });

  it('describes the page for social previews with the regional locales', () => {
    const de = buildPageMetadata({ ...base, locale: 'de', href: '/cv' });
    expect(de.openGraph).toEqual({
      type: 'website',
      siteName: 'melinastutz.com',
      title: base.title,
      description: base.description,
      url: 'https://melinastutz.com/de/cv/',
      locale: 'de_CH',
      alternateLocale: ['en_GB'],
    });
    const en = buildPageMetadata({ ...base, locale: 'en', href: '/cv' });
    expect(en.openGraph).toMatchObject({ locale: 'en_GB', alternateLocale: ['de_CH'] });
    expect(en.twitter).toEqual({ card: 'summary', title: base.title, description: base.description });
  });

  it('only sets robots when the page must stay out of the index', () => {
    expect(buildPageMetadata({ ...base, locale: 'de', href: '/cv' })).not.toHaveProperty('robots');
    expect(buildPageMetadata({ ...base, locale: 'de', href: '/cv', noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe('ownerTitle', () => {
  it('appends the owner with "|"', () => {
    expect(ownerTitle('Kontakt')).toBe('Kontakt | Melina Stutz');
  });
});
