// The home page's one rich moment: hospital work and education from 2017 to
// today on one axis, drawn from the CV data. Pure HTML and CSS, positions in
// percent of the axis, so it scales with the column. One accent: the master's
// that is running now and the "today" line; everything else uses neutral
// steps. Faint year hairlines run behind the bars like squared notebook paper.
import type { Locale } from '@/i18n/routing';
import { CLINICAL, EDUCATION, formatRange, type CvEntry, type YearMonth } from '@/data/cv';
import { buildMonth } from '@/lib/buildMonth';

const AXIS_START = 2017;
const AXIS_END = 2027; // exclusive: the axis runs to January 2027
const AXIS_MONTHS = (AXIS_END - AXIS_START) * 12;

function monthIndex(ym: YearMonth): number {
  const [y, m] = ym.split('-').map(Number);
  return (y - AXIS_START) * 12 + (m - 1);
}

const pct = (months: number) => `${((Math.min(Math.max(months, 0), AXIS_MONTHS) / AXIS_MONTHS) * 100).toFixed(3)}%`;

interface Row {
  entry: CvEntry;
  label: string;
  tone: 'strong' | 'soft' | 'accent';
}

interface Lane {
  name: string;
  rows: Row[];
}

const byId = (list: readonly CvEntry[], id: string) => {
  const found = list.find((e) => e.id === id);
  if (!found) throw new Error(`CV entry ${id} missing`);
  return found;
};

export function Timeline({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { title: string; caption: string; hospital: string; training: string; study: string; today: string };
}) {
  const now = buildMonth();
  const efz = byId(EDUCATION, 'efz');
  const bm = byId(EDUCATION, 'bm');
  const hospital = byId(CLINICAL, 'hospital');

  const lanes: Lane[] = [
    { name: labels.hospital, rows: [{ entry: hospital, label: hospital.short[locale], tone: 'strong' }] },
    { name: labels.training, rows: [{ entry: efz, label: `${efz.short[locale]}, ${bm.short[locale]}`, tone: 'soft' }] },
    {
      name: labels.study,
      rows: ['passerelle', 'bsc', 'msc'].map((id) => {
        const entry = byId(EDUCATION, id);
        return { entry, label: entry.short[locale], tone: id === 'msc' ? 'accent' : 'soft' } as Row;
      }),
    },
  ];

  // One tick per year inside the axis; the axis end (January 2027) gets none.
  const years = Array.from({ length: AXIS_END - AXIS_START }, (_, i) => AXIS_START + i);

  return (
    <figure className="timeline" aria-labelledby="timeline-title">
      <figcaption>
        <span id="timeline-title" className="timeline-title">
          {labels.title}
        </span>
        <span className="date">2017 – {now.slice(0, 4)}</span>
      </figcaption>

      <div className="timeline-body">
        <div className="timeline-grid" aria-hidden="true">
          {years.map((y) => (
            <span key={y} className="timeline-tick" style={{ left: pct((y - AXIS_START) * 12) }}>
              <span className="date">{y}</span>
            </span>
          ))}
        </div>

        {lanes.map((lane) => (
          <div className="timeline-lane" key={lane.name}>
            <span className="timeline-lane-name">{lane.name}</span>
            <ul className="timeline-rows">
              {lane.rows.map(({ entry, label, tone }) => {
                const start = monthIndex(entry.start);
                const end = monthIndex(entry.end ?? now) + 1;
                // The label sits on the side of its bar with more room: from the
                // start, or right-aligned to the end. It is in the flow, so a
                // long label wraps inside the axis and the row grows.
                const alignEnd = end > AXIS_MONTHS - start;
                return (
                  <li className="timeline-row" key={entry.id}>
                    <span
                      className={`timeline-label${alignEnd ? ' is-end' : ''}`}
                      style={alignEnd ? { marginRight: `calc(100% - ${pct(end)})` } : { marginLeft: pct(start) }}
                    >
                      {label} <span className="date">{formatRange(entry, locale)}</span>
                    </span>
                    <span
                      className={`timeline-bar tone-${tone}${entry.end === null ? ' is-ongoing' : ''}`}
                      style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="timeline-axis" aria-hidden="true">
          <span className="timeline-now" style={{ left: pct(monthIndex(now) + 1) }}>
            <span className="date">{labels.today}</span>
          </span>
        </div>
      </div>

      <p className="timeline-caption">{labels.caption}</p>
    </figure>
  );
}
