'use client';

// Site header: wordmark, two page links, the language switch and one quiet
// button (the hero keeps the one primary action). On small screens the links
// collapse into one menu button. The layout passes the locale and all labels
// as props, so the client needs no next-intl runtime.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { localePath, routing, type Locale } from '@/i18n/routing';
import { Icon } from './Icon';

export interface HeaderLabels {
  /** Accessible name of the page navigation. */
  nav: string;
  research: string;
  cv: string;
  contact: string;
  /** Text of the mobile menu button; `aria-expanded` carries its state. */
  menu: string;
  switchLabel: string;
  switchShort: string;
}

const LINKS = [
  { href: '/research', key: 'research' },
  { href: '/cv', key: 'cv' },
] as const;

/** Same page in the other locale: `/de/cv/` → `/en/cv/`. */
function switchPath(pathname: string, from: Locale, to: Locale): string {
  const rest = pathname.replace(new RegExp(`^/${from}(?=/|$)`), '') || '/';
  return localePath(to, rest);
}

export function Header({ locale, labels }: { locale: Locale; labels: HeaderLabels }) {
  const pathname = usePathname() ?? `/${locale}/`;
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  // Close the menu on every route change (also browser back and forward):
  // state adjusted during render, as React recommends instead of an effect.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setOpen(false);
  }

  // Escape closes the open menu and returns focus to its button.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

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
      {labels[key]}
    </Link>
  ));

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={localePath(locale, '/')} className="wordmark" onClick={() => setOpen(false)}>
          Melina Stutz
        </Link>
        <nav className="header-nav" aria-label={labels.nav}>
          {links}
        </nav>
        <div className="header-actions">
          <Link
            href={switchPath(pathname, locale, other)}
            className="lang-switch"
            hrefLang={other}
            lang={other}
            aria-label={labels.switchLabel}
          >
            {labels.switchShort}
          </Link>
          <Link
            href={localePath(locale, '/contact')}
            className="btn btn-secondary btn-small header-cta"
            aria-current={isCurrent('/contact') ? 'page' : undefined}
          >
            {labels.contact}
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} />
            <span>{labels.menu}</span>
          </button>
        </div>
      </div>
      <nav id="mobile-menu" className="mobile-menu" hidden={!open} aria-label={labels.nav}>
        <div className="container mobile-menu-inner">
          {links}
          <Link
            href={localePath(locale, '/contact')}
            className="nav-link"
            aria-current={isCurrent('/contact') ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {labels.contact}
          </Link>
        </div>
      </nav>
    </header>
  );
}
