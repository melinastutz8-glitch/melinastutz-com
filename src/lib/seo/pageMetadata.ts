// `generateMetadata` helper for the localized pages: reads the page title and
// description from the `meta` messages and builds canonical, hreflang and
// social metadata through buildPageMetadata.
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { isLocale } from '@/i18n/routing';
import { buildPageMetadata, ownerTitle } from './metadata';
import type { PageHref } from './pages';

type MetaKey = 'home' | 'research' | 'cv' | 'contact' | 'imprint' | 'privacy';

export async function localizedPageMetadata(
  params: Promise<{ locale: string }>,
  href: PageHref,
  key: MetaKey,
  options: { noindex?: boolean } = {},
): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  const rawTitle = t(`${key}Title`);
  return buildPageMetadata({
    locale,
    href,
    // The home title already carries the name.
    title: key === 'home' ? rawTitle : ownerTitle(rawTitle),
    description: t(`${key}Description`),
    noindex: options.noindex,
  });
}
