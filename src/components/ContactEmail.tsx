'use client';

// The contact e-mail as a `mailto:` link, rendered only in the browser
// (pattern from furchert-ch #147). The prerendered HTML and the RSC payload
// never carry the address: before mount (and for visitors without
// JavaScript) the element links to the contact page with a neutral label.
// The first client render equals the prerendered one, so hydration matches;
// the render after mount swaps in the address and the `mailto:` href.
import { useSyncExternalStore, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { localePath, type Locale } from '@/i18n/routing';
import { contactEmailAddress, contactMailtoHref } from '@/data/contact-email';

const noSubscribe = () => () => {};

interface ContactEmailProps {
  /** Visible text instead of the address, e.g. "PhD-Anfrage senden". */
  label?: ReactNode;
  /** Rendered after the label or address, e.g. an icon. */
  children?: ReactNode;
  /** Subject for the `mailto:` link. */
  subject?: string;
  className?: string;
}

export function ContactEmail({ label, children, subject, className }: ContactEmailProps) {
  const t = useTranslations('contact');
  const locale = useLocale() as Locale;
  // false while prerendering and during hydration, true once mounted.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const text = label ?? (mounted ? contactEmailAddress() : t('emailFallback'));
  const href = mounted ? contactMailtoHref(subject) : localePath(locale, '/contact');

  return (
    <a href={href} className={className}>
      {text}
      {children}
    </a>
  );
}
