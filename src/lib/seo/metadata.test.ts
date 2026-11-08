import { describe, expect, it } from 'vitest';
import { buildPageMetadata, languageAlternates, localizedUrl, ownerTitle, shareImageUrl, SITE_VIEWPORT } from './metadata';

const base = { title: 'Werdegang | Melina Stutz', description: 'Kurzbeschreibung.', imageAlt: 'Bildbeschreibung' };

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

describe('shareImageUrl', () => {
  it('points at the PNG of each locale', () => {
    expect(shareImageUrl('de')).toBe('https://melinastutz.com/de/og-image.png');
    expect(shareImageUrl('en')).toBe('https://melinastutz.com/en/og-image.png');
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

  it('describes the page for social previews with the regional locales and the share image', () => {
    const image = (locale: 'de' | 'en') => ({
      url: `https://melinastutz.com/${locale}/og-image.png`,
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: base.imageAlt,
    });
    const de = buildPageMetadata({ ...base, locale: 'de', href: '/cv' });
    expect(de.openGraph).toEqual({
      type: 'website',
      siteName: 'melinastutz.com',
      title: base.title,
      description: base.description,
      url: 'https://melinastutz.com/de/cv/',
      locale: 'de_CH',
      alternateLocale: ['en_GB'],
      images: [image('de')],
    });
    const en = buildPageMetadata({ ...base, locale: 'en', href: '/cv' });
    expect(en.openGraph).toMatchObject({ locale: 'en_GB', alternateLocale: ['de_CH'], images: [image('en')] });
    expect(en.twitter).toEqual({
      card: 'summary_large_image',
      title: base.title,
      description: base.description,
      images: [image('en')],
    });
  });

  it('resolves relative metadata URLs against the site', () => {
    expect(String(buildPageMetadata({ ...base, locale: 'en', href: '/' }).metadataBase)).toBe(
      'https://melinastutz.com/',
    );
  });

  it('only sets robots when the page must stay out of the index', () => {
    expect(buildPageMetadata({ ...base, locale: 'de', href: '/cv' })).not.toHaveProperty('robots');
    expect(buildPageMetadata({ ...base, locale: 'de', href: '/cv', noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe('SITE_VIEWPORT', () => {
  it('colours the browser UI with the page background of each colour scheme', () => {
    expect(SITE_VIEWPORT).toEqual({
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f7f6f1' },
        { media: '(prefers-color-scheme: dark)', color: '#111512' },
      ],
      colorScheme: 'light dark',
    });
  });
});

describe('ownerTitle', () => {
  it('appends the owner with "|"', () => {
    expect(ownerTitle('Kontakt')).toBe('Kontakt | Melina Stutz');
  });
});
