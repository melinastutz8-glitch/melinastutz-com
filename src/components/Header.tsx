'use client';

// Site header: wordmark, two page links, the language switch and one quiet
// button (the hero keeps the one primary action). On small screens the links
// collapse into one menu button.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { localePath, routing, type Locale } from '@/i18n/routing';
import { Icon } from './Icon';

const LINKS = [
  { href: '/research', key: 'research' },
  { href: '/cv', key: 'cv' },
] as const;

/** Same page in the other locale: `/de/cv/` → `/en/cv/`. */
function switchPath(pathname: string, from: Locale, to: Locale): string {
  const rest = pathname.replace(new RegExp(`^/${from}(?=/|$)`), '') || '/';
  return localePath(to, rest);
}

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? `/${locale}/`;
  const [open, setOpen] = useState(false);
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  const isCurrent = (href: string) => {
    const target = localePath(locale, href);
    const current = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return current === target;
  };

  const links = LINKS.map(({ href, key }) => (
    <Link
      key={key}
      href={localePath(locale, href)}
      className="nav-link"
      aria-current={isCurrent(href) ? 'page' : undefined}
      onClick={() => setOpen(false)}
    >
      {t(key)}
    </Link>
  ));

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={localePath(locale, '/')} className="wordmark" onClick={() => setOpen(false)}>
          Melina Stutz
        </Link>
        <nav className="header-nav" aria-label={t('label')}>
          {links}
        </nav>
        <div className="header-actions">
          <Link
            href={switchPath(pathname, locale, other)}
            className="lang-switch"
            hrefLang={other}
            lang={other}
            aria-label={t('switchLabel')}
          >
            {t('switchShort')}
          </Link>
          <Link
            href={localePath(locale, '/contact')}
            className="btn btn-secondary btn-small header-cta"
            aria-current={isCurrent('/contact') ? 'page' : undefined}
          >
            {t('contact')}
          </Link>
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} />
            <span>{open ? t('close') : t('menu')}</span>
          </button>
        </div>
      </div>
      <nav id="mobile-menu" className="mobile-menu" hidden={!open} aria-label={t('label')}>
        <div className="container mobile-menu-inner">
          {links}
          <Link
            href={localePath(locale, '/contact')}
            className="nav-link"
            aria-current={isCurrent('/contact') ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {t('contact')}
          </Link>
        </div>
      </nav>
    </header>
  );
}
