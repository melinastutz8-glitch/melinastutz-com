import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/routing';
import { ContactBand } from '@/components/ContactBand';
import { DnaModel } from '@/components/DnaModel';
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
      <header className="page-head">
        <div className="container page-head-inner">
          <h1 className="page-title">{t('title')}</h1>
          <p className="lead">{t('intro')}</p>
          <DnaModel
            label={t('dnaLabel')}
            hint={t('dnaHint')}
            caption={t('dnaCaption')}
            sourceLabel={t('dnaSources')}
            modelSource={t('dnaModelSource')}
            legend={{
              title: t('dnaLegendTitle'),
              A: t('dnaLegendA'),
              C: t('dnaLegendC'),
              G: t('dnaLegendG'),
              T: t('dnaLegendT'),
              P: t('dnaLegendP'),
              strand1: t('dnaLegendStrand1'),
              strand2: t('dnaLegendStrand2'),
            }}
          />
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('motivationHeading')}</h2>
          <div className="prose columns">
            <p>{t('motivationClinic')}</p>
            <p>{t('motivationMito')}</p>
          </div>
          <Pending label={pending}>{t('pendingQuestion')}</Pending>
        </div>
      </section>

      <section className="section">
        <div className="container">
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
        </div>
      </section>

      <section className="section">
        <div className="container">
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
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('publicationsHeading')}</h2>
          <Pending label={pending}>{t('pendingPublications')}</Pending>
        </div>
      </section>

      <ContactBand locale={locale} />
    </>
  );
}
