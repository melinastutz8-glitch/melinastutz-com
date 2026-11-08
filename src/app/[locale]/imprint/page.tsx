import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/routing';
import { ContactEmail } from '@/components/ContactEmail';
import { localizedPageMetadata } from '@/lib/seo/pageMetadata';

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata({ params }: Props) {
  return localizedPageMetadata(params, '/imprint', 'imprint');
}

export default async function ImprintPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'imprint' });

  return (
    <>
      <header className="page-head">
        <div className="container page-head-inner">
          <h1 className="page-title">{t('title')}</h1>
        </div>
      </header>
      <section className="section">
        <div className="container">
          <div className="legal">
            <h2 className="section-title">{t('responsibleHeading')}</h2>
            <p>
              {t('name')}
              <br />
              {t('location')}
              <br />
              {t('emailLabel')}: <ContactEmail className="text-link" />
            </p>
            <h2 className="section-title">{t('liabilityHeading')}</h2>
            <p>{t('liabilityText')}</p>
            <h2 className="section-title">{t('copyrightHeading')}</h2>
            <p>{t('copyrightText')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
