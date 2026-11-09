import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { routing } from '@/i18n/routing';
import { buildPageMetadata, languageAlternates, localizedUrl } from './metadata';
import { PAGE_LAST_MODIFIED, SITE_LAUNCH_DATE } from './pages';

const entries = sitemap();
const pages = Object.entries(PAGE_LAST_MODIFIED);
// Every language version of every page that has a last-modified date.
const versions = pages.flatMap(([href, date]) => routing.locales.map((locale) => ({ locale, href, date })));

describe('sitemap', () => {
  it('lists every language version of every page exactly once', () => {
    expect(entries).toHaveLength(routing.locales.length * pages.length);
    expect(entries.map((e) => e.url).sort()).toEqual(versions.map((v) => localizedUrl(v.locale, v.href)).sort());
  });

  it('uses the page date as lastmod for every locale, not the build time', () => {
    for (const { locale, href, date } of versions) {
      const entry = entries.find((e) => e.url === localizedUrl(locale, href));
      expect(entry?.lastModified, `${locale} ${href}`).toBe(date);
    }
  });

  it('has only URLs with a trailing slash', () => {
    for (const entry of entries) {
      expect(entry.url.endsWith('/'), entry.url).toBe(true);
      for (const url of Object.values(entry.alternates?.languages ?? {})) {
        expect(String(url).endsWith('/'), String(url)).toBe(true);
      }
    }
  });

  it('only has real calendar dates between the launch and today', () => {
    // Page dates are Swiss calendar dates; CI runs in UTC.
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
    for (const [href, date] of pages) {
      expect(date, href).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), href).toBe(date);
      expect(date >= SITE_LAUNCH_DATE && date <= today, `${href} ${date}`).toBe(true);
    }
  });

  it('agrees with the page metadata on canonical URL and language alternates', () => {
    for (const { locale, href } of versions) {
      const entry = entries.find((e) => e.url === localizedUrl(locale, href));
      const meta = buildPageMetadata({ locale, href, title: 't', description: 'd', imageAlt: 'a' });
      expect(entry?.url, `${locale} ${href}`).toBe(meta.alternates?.canonical);
      expect(entry?.alternates?.languages).toEqual(languageAlternates(href));
    }
  });
});
