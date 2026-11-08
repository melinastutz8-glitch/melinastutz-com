// Page metadata for every public page: one place for the URL and locale rules
// (canonical, hreflang, OpenGraph, Twitter). Pure functions, no I/O.
// Every URL ends with a slash, matching `trailingSlash: true` and the files
// nginx serves without a redirect.
import type { Metadata, Viewport } from 'next';
import { routing, localePath, type Locale } from '@/i18n/routing';
import { OWNER_NAME, SITE_NAME, SITE_URL } from './site';

/**
 * Browser UI colour (theme-color) and colour schemes of every page: the page
 * background `--bg` of globals.css in light and dark mode.
 */
export const SITE_VIEWPORT: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#111512' },
  ],
  colorScheme: 'light dark',
};

/** Size of the share image, rendered per locale by `src/app/[locale]/og-image.png/route.tsx`. */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Absolute URL of a locale's share image, e.g. `https://melinastutz.com/en/og-image.png`. */
export function shareImageUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}/og-image.png`;
}

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
  /** Alt text of the locale's share image. */
  imageAlt: string;
  /** Keep the page out of search results (links are still followed). */
  noindex?: boolean;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const { locale, href, title, description } = input;
  const url = localizedUrl(locale, href);
  // Set on every page: a page's `openGraph` replaces its parent's as a whole,
  // so an image inherited from the layout would be lost.
  const image = { url: shareImageUrl(locale), ...SHARE_IMAGE_SIZE, type: 'image/png', alt: input.imageAlt };
  return {
    metadataBase: new URL(SITE_URL),
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
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
