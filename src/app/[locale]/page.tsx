import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, localePath } from '@/i18n/routing';
import { CLINICAL, formatRange } from '@/data/cv';
import { buildMonth } from '@/lib/buildMonth';
import { Timeline } from '@/components/Timeline';
import { Icon } from '@/components/Icon';
import { ContactBand } from '@/components/ContactBand';
import { ContactEmail } from '@/components/ContactEmail';
import { JsonLdScript } from '@/components/JsonLdScript';
import { buildHomeJsonLd } from '@/lib/seo/jsonLd';
import { localizedUrl } from '@/lib/seo/metadata';
import { localizedPageMetadata } from '@/lib/seo/pageMetadata';
import { PAGE_LAST_MODIFIED } from '@/lib/seo/pages';

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata({ params }: Props) {
  return localizedPageMetadata(params, '/', 'home');
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const meta = await getTranslations({ locale, namespace: 'meta' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const contact = await getTranslations({ locale, namespace: 'contact' });
  const hospital = CLINICAL.find((e) => e.id === 'hospital');

  const profile: [string, ReactNode][] = [
    [t('profileFocusLabel'), t('profileFocus')],
    [t('profileSeekingLabel'), t('profileSeeking')],
    [
      t('profileClinicalLabel'),
      t.rich('profileClinical', {
        range: hospital ? formatRange(hospital, locale) : '',
        date: (chunks) => <span className="date">{chunks}</span>,
      }),
    ],
    [t('profileLanguagesLabel'), t('profileLanguages')],
  ];

  return (
    <>
      <JsonLdScript
        data={buildHomeJsonLd({
          locale,
          pageUrl: localizedUrl(locale, '/'),
          name: t('title'),
          description: meta('homeDescription'),
          dateModified: PAGE_LAST_MODIFIED['/'],
        })}
      />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <p className="status">
              <span className="date">{buildMonth()}</span> {t('status')}
            </p>
            <h1 className="hero-title">{t('title')}</h1>
            <p className="lead">{t('sub')}</p>
            <div className="actions">
              <ContactEmail
                locale={locale}
                label={t('ctaPrimary')}
                subject={contact('emailSubject')}
                className="btn btn-primary"
              />
              <Link href={localePath(locale, '/research')} className="btn btn-secondary">
                {t('ctaSecondary')}
              </Link>
            </div>
          </div>
          <Timeline
            locale={locale}
            labels={{
              title: t('timelineTitle'),
              caption: t('timelineCaption'),
              hospital: t('laneHospital'),
              training: t('laneTraining'),
              study: t('laneStudy'),
              today: common('today'),
            }}
          />
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2 className="section-title">{t('profileHeading')}</h2>
            <dl className="facts">
              {profile.map(([label, value]) => (
                <div className="fact" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="section-title">{t('moreHeading')}</h2>
            <ul className="link-list">
              <li>
                <Link href={localePath(locale, '/research')} className="link-row">
                  <span className="link-row-title">{meta('researchTitle')}</span>
                  <span className="link-row-text">{t('moreResearch')}</span>
                  <Icon name="arrowRight" />
                </Link>
              </li>
              <li>
                <Link href={localePath(locale, '/cv')} className="link-row">
                  <span className="link-row-title">{meta('cvTitle')}</span>
                  <span className="link-row-text">{t('moreCv')}</span>
                  <Icon name="arrowRight" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <ContactBand locale={locale} />
    </>
  );
}
