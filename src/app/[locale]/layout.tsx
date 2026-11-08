import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { mono, sans, serif } from '@/lib/fonts';
import { SITE_VIEWPORT } from '@/lib/seo/metadata';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import '@/styles/globals.css';

// Only the known locales exist; anything else is a plain 404 from nginx.
export const dynamicParams = false;

export const viewport: Viewport = SITE_VIEWPORT;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'nav' });

  // No NextIntlClientProvider: the client components get their strings as
  // props, so next-intl's message formatter stays out of the client bundle.
  // data-scroll-behavior lets Next turn off smooth scrolling while it scrolls
  // to the top on a route change.
  return (
    <html
      lang={locale}
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <a className="skip-link" href="#main">
          {t('skip')}
        </a>
        <Header
          locale={locale}
          labels={{
            nav: t('label'),
            research: t('research'),
            cv: t('cv'),
            contact: t('contact'),
            menu: t('menu'),
            switchLabel: t('switchLabel'),
            switchShort: t('switchShort'),
          }}
        />
        <main id="main" className="page-enter">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
