// Curriculum vitae data, taken from Melina's CV (Lebenslauf, 2026).
// Dates are `YYYY-MM`; `end: null` means ongoing. The home-page timeline and
// the CV page both read from here, so the two never disagree.
// English keeps Swiss institution and qualification names that have no
// official English form, with a short gloss in brackets.
import type { Locale } from '@/i18n/routing';

export type Localized = Record<Locale, string>;
export type YearMonth = `${number}-${number}`;

export interface CvEntry {
  id: string;
  title: Localized;
  org: Localized;
  start: YearMonth;
  end: YearMonth | null;
  /** Short label for the timeline bar. */
  short: Localized;
  /** One line about the role, shown on the CV page (no trailing period). */
  note?: Localized;
}

export const EDUCATION: readonly CvEntry[] = [
  {
    id: 'msc',
    title: { de: 'Master of Science in Biomedicine', en: 'Master of Science in Biomedicine' },
    org: { de: 'Universität Zürich', en: 'University of Zurich' },
    start: '2025-09',
    end: null,
    short: { de: 'MSc', en: 'MSc' },
  },
  {
    id: 'bsc',
    title: { de: 'Bachelor of Science in Biomedicine', en: 'Bachelor of Science in Biomedicine' },
    org: { de: 'Universität Zürich', en: 'University of Zurich' },
    start: '2021-09',
    end: '2025-06',
    short: { de: 'BSc Biomedizin', en: 'BSc Biomedicine' },
  },
  {
    id: 'passerelle',
    title: { de: 'Passerelle', en: 'Passerelle (bridging course to university)' },
    org: {
      de: 'Aargauische Maturitätsschule für Erwachsene, Aarau',
      en: 'Aargauische Maturitätsschule für Erwachsene, Aarau',
    },
    start: '2020-08',
    end: '2021-07',
    short: { de: 'Passerelle', en: 'Passerelle' },
  },
  {
    id: 'bm',
    title: { de: 'Berufsmaturität', en: 'Vocational baccalaureate' },
    org: { de: 'Berufsbildungsschule Winterthur', en: 'Berufsbildungsschule Winterthur (vocational school)' },
    start: '2017-08',
    end: '2020-08',
    short: { de: 'Berufsmaturität', en: 'vocational baccalaureate' },
  },
  {
    id: 'efz',
    title: {
      de: 'Fachfrau Gesundheit EFZ',
      en: 'Fachfrau Gesundheit EFZ (trained healthcare worker, Swiss federal VET diploma)',
    },
    org: {
      de: 'Zentrum für Ausbildung im Gesundheitswesen, Winterthur',
      en: 'Zentrum für Ausbildung im Gesundheitswesen, Winterthur (healthcare training centre)',
    },
    start: '2017-08',
    end: '2020-08',
    // The timeline lane is already called "Lehre", so the German label stays short.
    short: { de: 'FaGe EFZ', en: 'Apprenticeship' },
  },
];

export const CLINICAL: readonly CvEntry[] = [
  {
    id: 'hospital',
    title: { de: 'Fachfrau Gesundheit', en: 'Fachfrau Gesundheit (trained healthcare worker)' },
    org: { de: 'Bezirksspital Affoltern am Albis', en: 'Bezirksspital Affoltern am Albis (district hospital)' },
    start: '2017-08',
    end: '2026-02',
    short: { de: 'Bezirksspital Affoltern', en: 'Bezirksspital Affoltern' },
    note: {
      de: 'Pflege und Betreuung im Akutspital, parallel zu Passerelle und Studium',
      en: 'Patient care in an acute hospital, alongside the Passerelle and my studies',
    },
  },
];

export const ENGAGEMENT: readonly CvEntry[] = [
  {
    id: 'cavalry',
    title: { de: 'Jugendförderung', en: 'Youth programme' },
    org: { de: 'Kavallerieverein Freiamt', en: 'Kavallerieverein Freiamt (riding club)' },
    start: '2026-01',
    end: null,
    short: { de: 'Jugendförderung', en: 'Youth programme' },
    note: { de: 'Anlässe planen und organisieren', en: 'Planning and organising events' },
  },
  {
    id: 'tutor',
    title: { de: 'Nachhilfelehrerin Mathematik', en: 'Mathematics tutor' },
    org: { de: 'Privat', en: 'Private' },
    start: '2022-08',
    end: null,
    short: { de: 'Nachhilfe', en: 'Tutoring' },
    note: {
      de: 'Oberstufenschülerinnen und -schüler in Mathematik unterstützen',
      en: 'Supporting secondary-school students in mathematics',
    },
  },
  {
    id: 'jugi',
    title: { de: 'Jugi-Leiterin', en: 'Youth gymnastics coach' },
    org: { de: 'Turnverein Merenschwand', en: 'Turnverein Merenschwand (gymnastics club)' },
    start: '2020-08',
    end: '2024-07',
    short: { de: 'Jugi', en: 'Youth gymnastics' },
    note: {
      de: 'Trainings für Kinder bis zur 3. Klasse planen und leiten',
      en: 'Planning and leading training for children up to year 3',
    },
  },
];

export const LANGUAGES: readonly Localized[] = [
  { de: 'Deutsch', en: 'German' },
  { de: 'Englisch', en: 'English' },
  { de: 'Französisch', en: 'French' },
];

export const INTERESTS: readonly Localized[] = [
  { de: 'Reiten', en: 'Horse riding' },
  { de: 'Geräteturnen', en: 'gymnastics' },
  { de: 'Snowboarden', en: 'snowboarding' },
  { de: 'Langstreckenläufe', en: 'long-distance running' },
];

/** Public LinkedIn profile URL; empty until Melina sends it (then the link appears). */
export const LINKEDIN_URL = '';

/**
 * Lab-notebook style range, the site's signature detail: `2017-08 – 2026-02`,
 * or `seit 2025-09` / `since 2025-09` when ongoing.
 */
export function formatRange(entry: Pick<CvEntry, 'start' | 'end'>, locale: Locale): string {
  if (entry.end === null) return `${locale === 'de' ? 'seit' : 'since'} ${entry.start}`;
  return `${entry.start} – ${entry.end}`;
}
