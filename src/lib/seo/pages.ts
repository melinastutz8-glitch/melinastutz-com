// Last significant change of every public page (ISO date, Swiss calendar).
// The sitemap's <lastmod> comes from here, so keep it accurate: search engines
// ignore lastmod values that are not. Bump a page's date when its main
// content or its structured data changes; header and footer changes do not
// count. A new public page needs an entry here: its generateMetadata takes a
// `PageHref`, so typecheck fails otherwise.
export const SITE_LAUNCH_DATE = '2026-11-08';

export const PAGE_LAST_MODIFIED = {
  '/': '2026-11-08',
  '/research': '2026-11-08',
  '/cv': '2026-11-08',
  '/contact': '2026-11-08',
  '/imprint': '2026-11-08',
  '/privacy': '2026-11-08',
} as const satisfies Record<string, `${number}-${number}-${number}`>;

export type PageHref = keyof typeof PAGE_LAST_MODIFIED;
