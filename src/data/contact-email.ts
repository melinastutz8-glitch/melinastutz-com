// The contact e-mail address, assembled only at runtime in the browser
// (pattern from furchert-ch #147). Neither this source, the exported HTML,
// the RSC `.txt` payloads nor the client bundle carries the address as one
// string, so scrapers that read them find none: the segments are stored
// reversed and joined only when called. Render the address through
// <ContactEmail>, which calls these helpers only after mount. Never call them
// in a server component: the address would land in `out/` (CI greps for it).

// Local part, domain, top-level domain; each reversed.
const SEGMENTS = ['ofni', 'ztutsanilem', 'moc'] as const;

const unreverse = (s: string) => s.split('').reverse().join('');

/** The address itself. Call it in the browser (or in tests), never during prerendering. */
export function contactEmailAddress(): string {
  const [local, domain, tld] = SEGMENTS.map(unreverse);
  return `${local}@${domain}.${tld}`;
}

/** `mailto:` href with an optional, encoded subject. */
export function contactMailtoHref(subject?: string): string {
  const href = `mailto:${contactEmailAddress()}`;
  return subject ? `${href}?subject=${encodeURIComponent(subject)}` : href;
}
