// Closing band of the home, research and CV pages: one question, one line of
// text and the button to the contact page.
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { localePath, type Locale } from '@/i18n/routing';

export async function ContactBand({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <section className="section cta-band">
      <div className="container cta-inner">
        <div>
          <h2 className="section-title">{t('ctaHeading')}</h2>
          <p className="muted-text">{t('ctaText')}</p>
        </div>
        <Link href={localePath(locale, '/contact')} className="btn btn-primary">
          {t('ctaButton')}
        </Link>
      </div>
    </section>
  );
}
