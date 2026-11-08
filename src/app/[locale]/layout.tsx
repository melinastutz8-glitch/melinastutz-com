import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { sans, serif } from '@/lib/fonts';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import '@/styles/globals.css';

// Only the known locales exist; anything else is a plain 404 from nginx.
export const dynamicParams = false;

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

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'nav' });
  // Client components only need these namespaces; the rest stays on the server.
  const clientMessages = { nav: messages.nav, contact: messages.contact };

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          {t('skip')}
        </a>
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <Header />
          <main id="main" className="page-enter">
            {children}
          </main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
