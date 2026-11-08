// Curriculum vitae data, taken from Melina's CV (Lebenslauf, 2026).
// Dates are `YYYY-MM`; `end: null` means ongoing. The home-page timeline and
// the CV page both read from here, so the two never disagree.
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
  /** One line about the role, shown on the CV page. */
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
    title: { de: 'Passerelle', en: 'Passerelle (university entrance qualification)' },
    org: {
      de: 'Aargauische Maturitätsschule für Erwachsene, Aarau',
      en: 'Aargau Maturity School for Adults, Aarau',
    },
    start: '2020-08',
    end: '2021-07',
    short: { de: 'Passerelle', en: 'Passerelle' },
  },
  {
    id: 'bm',
    title: { de: 'Berufsmaturität', en: 'Vocational baccalaureate' },
    org: { de: 'Berufsbildungsschule Winterthur', en: 'Vocational school Winterthur' },
    start: '2017-08',
    end: '2020-08',
    short: { de: 'Berufsmaturität', en: 'Vocational baccalaureate' },
  },
  {
    id: 'efz',
    title: {
      de: 'Fachfrau Gesundheit EFZ',
      en: 'Healthcare professional, Swiss federal VET diploma (EFZ)',
    },
    org: {
      de: 'Zentrum für Ausbildung im Gesundheitswesen, Winterthur',
      en: 'Centre for Healthcare Education, Winterthur',
    },
    start: '2017-08',
    end: '2020-08',
    short: { de: 'Lehre FaGe EFZ', en: 'Apprenticeship' },
  },
];

export const CLINICAL: readonly CvEntry[] = [
  {
    id: 'hospital',
    title: { de: 'Fachfrau Gesundheit', en: 'Healthcare professional' },
    org: { de: 'Bezirksspital Affoltern am Albis', en: 'District hospital Affoltern am Albis' },
    start: '2017-08',
    end: '2026-02',
    short: { de: 'Bezirksspital Affoltern', en: 'District hospital Affoltern' },
    note: {
      de: 'Pflege und Betreuung im Akutspital, parallel zu Passerelle und Studium.',
      en: 'Nursing care in an acute hospital, alongside the pre-university course and my studies.',
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
  { de: 'Geräteturnen', en: 'Gymnastics' },
  { de: 'Snowboarden', en: 'Snowboarding' },
  { de: 'Langstreckenläufe', en: 'Long-distance running' },
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
