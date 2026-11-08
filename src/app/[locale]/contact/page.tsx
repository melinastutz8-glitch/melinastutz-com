import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/routing';
import { LINKEDIN_URL } from '@/data/cv';
import { ContactEmail } from '@/components/ContactEmail';
import { Icon } from '@/components/Icon';
import { localizedPageMetadata } from '@/lib/seo/pageMetadata';

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata({ params }: Props) {
  return localizedPageMetadata(params, '/contact', 'contact');
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <>
      <header className="page-head container">
        <h1 className="page-title">{t('title')}</h1>
        <p className="lead">{t('intro')}</p>
      </header>

      <section className="section container">
        <dl className="entry-list contact-list">
          <div className="entry">
            <dt className="entry-title">{t('emailHeading')}</dt>
            <dd>
              <ContactEmail subject={t('emailSubject')} className="contact-email">
                <Icon name="arrowRight" />
              </ContactEmail>
            </dd>
          </div>
          {LINKEDIN_URL ? (
            <div className="entry">
              <dt className="entry-title">{t('linkedinHeading')}</dt>
              <dd>
                <a href={LINKEDIN_URL} className="text-link" rel="me noopener noreferrer" target="_blank">
                  {t('linkedinLabel')} <Icon name="arrowUpRight" />
                </a>
              </dd>
            </div>
          ) : null}
          <div className="entry">
            <dt className="entry-title">{t('locationHeading')}</dt>
            <dd className="entry-text">{t('location')}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
