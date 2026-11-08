import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { languageAlternates, localizedUrl } from '@/lib/seo/metadata';
import { PAGE_LAST_MODIFIED } from '@/lib/seo/pages';

// Exported as out/sitemap.xml at build time.
export const dynamic = 'force-static';

// One entry per page: the default-locale URL plus its language alternates,
// the same URLs the pages' canonical and hreflang tags use. <lastmod> is the
// page's last significant change (src/lib/seo/pages.ts), not the build time.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(PAGE_LAST_MODIFIED).map(([href, lastModified]) => ({
    url: localizedUrl(routing.defaultLocale, href),
    lastModified,
    alternates: { languages: languageAlternates(href) },
  }));
}
