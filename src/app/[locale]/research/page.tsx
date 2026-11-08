import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/routing';
import { Pending } from '@/components/Pending';
import { localizedPageMetadata } from '@/lib/seo/pageMetadata';

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata({ params }: Props) {
  return localizedPageMetadata(params, '/research', 'research');
}

export default async function ResearchPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'research' });
  const pending = (await getTranslations({ locale, namespace: 'common' }))('pending');

  return (
    <>
      <header className="page-head container">
        <h1 className="page-title">{t('title')}</h1>
        <p className="lead">{t('intro')}</p>
      </header>

      <section className="section container">
        <h2 className="section-title">{t('motivationHeading')}</h2>
        <div className="prose columns">
          <p>{t('motivationClinic')}</p>
          <p>{t('motivationMito')}</p>
        </div>
        <Pending label={pending}>{t('pendingQuestion')}</Pending>
      </section>

      <section className="section container">
        <h2 className="section-title">{t('methodsHeading')}</h2>
        <dl className="entry-list">
          {(['methodsMolecular', 'methodsCell', 'methodsData'] as const).map((key) => (
            <div className="entry" key={key}>
              <dt className="entry-title">{t(key)}</dt>
              <dd>
                <Pending label={pending}>{t('pendingMethods')}</Pending>
              </dd>
            </div>
          ))}
          <div className="entry">
            <dt className="entry-title">{t('methodsClinical')}</dt>
            <dd className="entry-text">{t('methodsClinicalText')}</dd>
          </div>
        </dl>
      </section>

      <section className="section container">
        <h2 className="section-title">{t('projectsHeading')}</h2>
        <dl className="entry-list">
          <div className="entry">
            <dt className="entry-title">{t('projectBachelor')}</dt>
            <dd>
              <Pending label={pending}>{t('pendingBachelor')}</Pending>
            </dd>
          </div>
          <div className="entry">
            <dt className="entry-title">{t('projectOther')}</dt>
            <dd>
              <Pending label={pending}>{t('pendingOther')}</Pending>
            </dd>
          </div>
        </dl>
      </section>

      <section className="section container">
        <h2 className="section-title">{t('publicationsHeading')}</h2>
        <Pending label={pending}>{t('pendingPublications')}</Pending>
      </section>
    </>
  );
}
