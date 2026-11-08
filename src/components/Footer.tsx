import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { localePath, type Locale } from '@/i18n/routing';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <p className="wordmark">Melina Stutz</p>
          <p className="muted">{t('tagline')}</p>
        </div>
        <nav className="footer-links" aria-label={nav('label')}>
          <Link href={localePath(locale, '/research')}>{nav('research')}</Link>
          <Link href={localePath(locale, '/cv')}>{nav('cv')}</Link>
          <Link href={localePath(locale, '/contact')}>{nav('contact')}</Link>
        </nav>
        <nav className="footer-links" aria-label={t('legal')}>
          <Link href={localePath(locale, '/imprint')}>{t('imprint')}</Link>
          <Link href={localePath(locale, '/privacy')}>{t('privacy')}</Link>
        </nav>
      </div>
      <div className="container">
        <div className="footer-bottom">
          <span className="muted">© 2026 Melina Fabienne Stutz</span>
          <span className="muted">{t('credit')}</span>
        </div>
      </div>
    </footer>
  );
}
