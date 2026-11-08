import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/i18n/routing';
import { CLINICAL, EDUCATION, ENGAGEMENT, INTERESTS, LANGUAGES, formatRange, type CvEntry } from '@/data/cv';
import { JsonLdScript } from '@/components/JsonLdScript';
import { buildProfilePageJsonLd } from '@/lib/seo/jsonLd';
import { localizedUrl } from '@/lib/seo/metadata';
import { localizedPageMetadata } from '@/lib/seo/pageMetadata';
import { PAGE_LAST_MODIFIED } from '@/lib/seo/pages';

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata({ params }: Props) {
  return localizedPageMetadata(params, '/cv', 'cv');
}

function Entries({ entries, locale }: { entries: readonly CvEntry[]; locale: Locale }) {
  return (
    <ol className="cv-list">
      {entries.map((e) => (
        <li className="cv-item" key={e.id}>
          <span className="date cv-date">{formatRange(e, locale)}</span>
          <div>
            <p className="entry-title">{e.title[locale]}</p>
            <p className="muted">{e.org[locale]}</p>
            {e.note ? <p className="entry-text">{e.note[locale]}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function CvPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'cv' });
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return (
    <>
      <JsonLdScript
        data={buildProfilePageJsonLd({
          locale,
          pageUrl: localizedUrl(locale, '/cv'),
          name: t('title'),
          description: meta('cvDescription'),
          dateModified: PAGE_LAST_MODIFIED['/cv'],
        })}
      />

      <header className="page-head container">
        <h1 className="page-title">{t('title')}</h1>
        <p className="lead">{t('intro')}</p>
      </header>

      <section className="section container cv-section">
        <h2 className="section-title">{t('educationHeading')}</h2>
        <Entries entries={EDUCATION} locale={locale} />
      </section>

      <section className="section container cv-section">
        <h2 className="section-title">{t('clinicalHeading')}</h2>
        <Entries entries={CLINICAL} locale={locale} />
      </section>

      <section className="section container cv-section">
        <h2 className="section-title">{t('engagementHeading')}</h2>
        <Entries entries={ENGAGEMENT} locale={locale} />
      </section>

      <section className="section container split">
        <div>
          <h2 className="section-title">{t('languagesHeading')}</h2>
          <p className="entry-text">{LANGUAGES.map((l) => l[locale]).join(', ')}</p>
        </div>
        <div>
          <h2 className="section-title">{t('interestsHeading')}</h2>
          <p className="entry-text">{INTERESTS.map((i) => i[locale]).join(', ')}</p>
        </div>
      </section>
    </>
  );
}
