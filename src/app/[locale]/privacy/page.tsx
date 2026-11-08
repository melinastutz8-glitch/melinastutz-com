import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/routing';
import { localizedPageMetadata } from '@/lib/seo/pageMetadata';

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata({ params }: Props) {
  return localizedPageMetadata(params, '/privacy', 'privacy');
}

const SECTIONS = ['controller', 'visit', 'hosting', 'noTracking', 'email', 'rights'] as const;

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return (
    <>
      <header className="page-head container">
        <h1 className="page-title">{t('title')}</h1>
        <p className="date">{t('updated')}</p>
      </header>
      <section className="section container legal">
        <p>{t('introText')}</p>
        {SECTIONS.map((key) => (
          <div key={key}>
            <h2 className="section-title">{t(`${key}Heading`)}</h2>
            <p>{t(`${key}Text`)}</p>
          </div>
        ))}
      </section>
    </>
  );
}
