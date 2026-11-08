import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { languageAlternates, localizedUrl } from '@/lib/seo/metadata';
import { PAGE_LAST_MODIFIED } from '@/lib/seo/pages';

// Exported as out/sitemap.xml at build time.
export const dynamic = 'force-static';

// One <url> per language version of every page, each with the full set of
// language alternates: the same URLs the pages' canonical and hreflang tags
// use. <lastmod> is the page's last significant change
// (src/lib/seo/pages.ts), not the build time, and the same for every locale.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(PAGE_LAST_MODIFIED).flatMap(([href, lastModified]) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, href),
      lastModified,
      alternates: { languages: languageAlternates(href) },
    })),
  );
}
