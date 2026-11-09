'use client';

// The contact e-mail as a `mailto:` link, rendered only in the browser
// (pattern from furchert-ch #147). The prerendered HTML and the RSC payload
// never carry the address: before mount (and for visitors without
// JavaScript) the element links to the contact page with a neutral label.
// The first client render equals the prerendered one, so hydration matches;
// the render after mount swaps in the address and the `mailto:` href.
// Callers (server components) pass the locale and the translated strings, so
// the client needs no next-intl runtime.
import { useSyncExternalStore, type ReactNode } from 'react';
import { localePath, type Locale } from '@/i18n/routing';
import { contactEmailAddress, contactMailtoHref } from '@/data/contact-email';

const noSubscribe = () => () => {};

type ContactEmailProps = {
  /** Locale of the contact page the link points to before mount. */
  locale: Locale;
  /** Rendered after the label or address, e.g. an icon. */
  children?: ReactNode;
  /** Subject for the `mailto:` link. */
  subject?: string;
  className?: string;
} & (
  | {
      /** Visible text instead of the address, e.g. "E-Mail schreiben". */
      label: ReactNode;
      fallbackLabel?: never;
    }
  | {
      label?: never;
      /** Shows the address once mounted; this text before, e.g. "E-Mail-Adresse anzeigen". */
      fallbackLabel: string;
    }
);

export function ContactEmail({ locale, label, fallbackLabel, children, subject, className }: ContactEmailProps) {
  // false while prerendering and during hydration, true once mounted.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const text = label ?? (mounted ? contactEmailAddress() : fallbackLabel);
  const href = mounted ? contactMailtoHref(subject) : localePath(locale, '/contact');

  return (
    <a href={href} className={className}>
      {text}
      {children}
    </a>
  );
}
