import { defineRouting } from 'next-intl/routing';

// Every URL carries its locale (`/de/…`, `/en/…`). There is no middleware in
// a static export, so nginx redirects the bare `/` to `/de/`
// (nginx/default.conf).
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'always',
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** Type guard for narrowing a route `locale` param to `Locale`. */
export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Path of a page in one locale, always with a trailing slash so it matches
 * the exported `index.html` files without an nginx redirect.
 * `localePath('en', '/cv')` → `/en/cv/`, `localePath('de', '/')` → `/de/`.
 */
export function localePath(locale: Locale, href: string): string {
  const path = href === '/' ? '' : href.replace(/\/+$/, '');
  return `/${locale}${path}/`;
}
