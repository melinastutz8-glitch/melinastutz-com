// Page-level JSON-LD (schema.org). Pure functions, no I/O.
// Rules: the data matches what the page shows (no hidden claims), and the
// owner appears with name, site URL, study and public profile links only:
// no e-mail, phone or street address.
import type { Locale } from '@/i18n/routing';
import { LINKEDIN_URL } from '@/data/cv';
import { OWNER_NAME, SITE_NAME, SITE_URL } from './site';

export type JsonLd = Record<string, unknown>;

// Stable `@id`s: every page refers to the same site and person, so search
// engines merge the nodes into one entity.
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#person`;

const JOB_TITLE: Record<Locale, string> = {
  de: 'Masterstudentin Biomedizin',
  en: 'MSc student in Biomedicine',
};

export function personNode(locale: Locale): JsonLd {
  const sameAs = LINKEDIN_URL ? [LINKEDIN_URL] : [];
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: OWNER_NAME,
    url: `${SITE_URL}/`,
    jobTitle: JOB_TITLE[locale],
    affiliation: { '@type': 'CollegeOrUniversity', name: 'Universität Zürich', url: 'https://www.uzh.ch/' },
    knowsAbout: ['Biomedicine', 'Mitochondria', 'Metabolism'],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * JSON for an inline `<script type="application/ld+json">`: `<` and the two
 * JS line terminators are escaped so no value can close the script element.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export interface PageJsonLdInput {
  locale: Locale;
  /** Canonical absolute URL of the localized page. */
  pageUrl: string;
  /** Page name, e.g. the visible h1. */
  name: string;
  description: string;
  /** ISO date of the last significant change (pages.ts). */
  dateModified: string;
}

// Home page: the WebSite node, the localized page and the owner.
export function buildHomeJsonLd(input: PageJsonLdInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: OWNER_NAME,
        alternateName: SITE_NAME,
        inLanguage: ['de', 'en'],
        publisher: { '@id': PERSON_ID },
      },
      {
        '@type': 'WebPage',
        '@id': `${input.pageUrl}#webpage`,
        url: input.pageUrl,
        name: input.name,
        description: input.description,
        inLanguage: input.locale,
        dateModified: input.dateModified,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': PERSON_ID },
      },
      personNode(input.locale),
    ],
  };
}

// CV page: the owner's profile page, with the Person as its main entity.
export function buildProfilePageJsonLd(input: PageJsonLdInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${input.pageUrl}#webpage`,
        url: input.pageUrl,
        name: input.name,
        description: input.description,
        inLanguage: input.locale,
        dateModified: input.dateModified,
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: personNode(input.locale),
      },
    ],
  };
}
