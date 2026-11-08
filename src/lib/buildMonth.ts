// Month the site was built, as a lab-notebook date (`2026-11`), on the Swiss
// calendar. The site is a static export, so this is fixed at build time: the
// hero status and the timeline's "today" line both read it and always agree.
import type { YearMonth } from '@/data/cv';

export function buildMonth(now: Date = new Date()): YearMonth {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const part = (type: 'year' | 'month') => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}` as YearMonth;
}
