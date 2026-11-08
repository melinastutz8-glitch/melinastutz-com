// Page metadata for every public page: one place for the URL and locale rules
// (canonical, hreflang, OpenGraph, Twitter). Pure functions, no I/O.
// Every URL ends with a slash, matching `trailingSlash: true` and the files
// nginx serves without a redirect.
import type { Metadata } from 'next';
import { routing, localePath, type Locale } from '@/i18n/routing';
import { OWNER_NAME, SITE_NAME, SITE_URL } from './site';

/** Document title with the owner's name: "Forschung | Melina Stutz". */
export function ownerTitle(title: string): string {
  return `${title} | ${OWNER_NAME}`;
}

// Regional OpenGraph locales: the site is written for Switzerland.
export const OG_LOCALE: Record<Locale, string> = { de: 'de_CH', en: 'en_GB' };

/** Absolute URL of a page in one locale, e.g. `/cv` → `https://melinastutz.com/en/cv/`. */
export function localizedUrl(locale: Locale, href: string): string {
  return SITE_URL + localePath(locale, href);
}

/** hreflang alternates of a page: one per locale, plus `x-default` on the German page. */
export function languageAlternates(href: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) languages[locale] = localizedUrl(locale, href);
  languages['x-default'] = localizedUrl(routing.defaultLocale, href);
  return languages;
}

export interface PageMetadataInput {
  locale: Locale;
  /** Locale-less path of the page, e.g. `/` or `/cv`. */
  href: string;
  /** Full document title. */
  title: string;
  description: string;
  /** Keep the page out of search results (links are still followed). */
  noindex?: boolean;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const { locale, href, title, description } = input;
  const url = localizedUrl(locale, href);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(href) },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: { card: 'summary', title, description },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
