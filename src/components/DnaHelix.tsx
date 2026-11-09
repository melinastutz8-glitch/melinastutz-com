'use client';

// A slowly turning DNA double helix made of the first 48 base pairs of the
// human mitochondrial genome (src/data/mtdna.ts), drawn as SVG in the style of
// a textbook figure: B-DNA with minor and major grooves (geometry in
// src/lib/helix.ts), base-pair rungs whose halves carry the colour of their
// base, the sequence as a 5′ → 3′ readout in the same colours, and a position
// ruler like a genome browser.
//
// - The server renders a still first frame, so the helix is there without
//   JavaScript and the first client render matches it.
// - In the browser, one requestAnimationFrame loop moves the phase and
//   rewrites the path data through the DOM, without React re-renders.
// - The loop runs only while the helix is on screen and the tab is visible,
//   and not at all when the visitor prefers reduced motion.
import { useEffect, useRef } from 'react';
import { complement, MTDNA_SOURCE, MTDNA_START } from '@/data/mtdna';
import {
  basePairX,
  formatCoordinate as f,
  GROOVE_OFFSET,
  HELIX,
  helixWidth,
  rulerPositions,
  rung,
  strandPaths,
  type Band,
} from '@/lib/helix';

const TOP = MTDNA_START.split('');
const BOTTOM = complement(MTDNA_START).split('');
const WIDTH = helixWidth(TOP.length);
const RULER = rulerPositions(TOP.length);
/** One full turn every 18 s. */
const RADIANS_PER_MS = (2 * Math.PI) / 18000;
const BANDS: Band[] = ['back', 'mid', 'front'];

const Y_TOP_LETTERS = 20;
const Y_BOTTOM_LETTERS = 158;
const Y_RULER_TICK = 168;
const Y_RULER_LABEL = 186;

export interface DnaHelixProps {
  label: string;
  caption: string;
  sourceLabel: string;
}

export function DnaHelix({ label, caption, sourceLabel }: DnaHelixProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const a0 = strandPaths(0, 0, WIDTH);
  const b0 = strandPaths(0, GROOVE_OFFSET, WIDTH);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const part = (name: string) => svg.querySelector<SVGPathElement>(`[data-part="${name}"]`);
    const strands = BANDS.flatMap((band) => [
      { el: part(`a-${band}`), strand: 'a' as const, band },
      { el: part(`b-${band}`), strand: 'b' as const, band },
    ]);
    const halvesA = Array.from(svg.querySelectorAll<SVGLineElement>('[data-part="pair-a"]'));
    const halvesB = Array.from(svg.querySelectorAll<SVGLineElement>('[data-part="pair-b"]'));

    let phase = 0;
    let last = 0;
    let raf = 0;
    let onScreen = false;

    const draw = () => {
      const a = strandPaths(phase, 0, WIDTH);
      const b = strandPaths(phase, GROOVE_OFFSET, WIDTH);
      for (const s of strands) s.el?.setAttribute('d', (s.strand === 'a' ? a : b)[s.band]);
      for (let i = 0; i < halvesA.length; i++) {
        const r = rung(i, phase);
        halvesA[i].setAttribute('y1', f(r.ya));
        halvesA[i].setAttribute('y2', f(r.ym));
        halvesB[i].setAttribute('y1', f(r.ym));
        halvesB[i].setAttribute('y2', f(r.yb));
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last) phase -= (now - last) * RADIANS_PER_MS;
      last = now;
      draw();
    };
    const start = () => {
      if (raf || !onScreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    observer.observe(svg);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const strand = (name: 'a' | 'b', band: Band, d: string) => (
    <path key={`${name}-${band}`} data-part={`${name}-${band}`} className={`helix-strand helix-strand-${name} is-${band}`} d={d} />
  );

  return (
    <figure className="helix" role="group" aria-label={label}>
      <div className="helix-viewport">
        <svg
          ref={svgRef}
          className="helix-svg"
          width={WIDTH}
          height={HELIX.height}
          viewBox={`0 0 ${WIDTH} ${HELIX.height}`}
          aria-hidden="true"
          focusable="false"
        >
          {strand('a', 'back', a0.back)}
          {strand('b', 'back', b0.back)}
          {TOP.map((base, i) => {
            const r = rung(i, 0);
            return (
              <g key={i}>
                <line data-part="pair-a" className={`helix-pair base-${base}`} x1={r.x} x2={r.x} y1={f(r.ya)} y2={f(r.ym)} />
                <line data-part="pair-b" className={`helix-pair base-${BOTTOM[i]}`} x1={r.x} x2={r.x} y1={f(r.ym)} y2={f(r.yb)} />
              </g>
            );
          })}
          {strand('a', 'mid', a0.mid)}
          {strand('b', 'mid', b0.mid)}
          {strand('a', 'front', a0.front)}
          {strand('b', 'front', b0.front)}

          <text className="helix-end" x={12} y={Y_TOP_LETTERS}>
            5′
          </text>
          <text className="helix-end" x={12} y={Y_BOTTOM_LETTERS}>
            3′
          </text>
          <text className="helix-end" x={WIDTH - 12} y={Y_TOP_LETTERS} textAnchor="end">
            3′
          </text>
          <text className="helix-end" x={WIDTH - 12} y={Y_BOTTOM_LETTERS} textAnchor="end">
            5′
          </text>
          {TOP.map((base, i) => (
            <text key={`t${i}`} className={`helix-base base-${base}`} x={basePairX(i)} y={Y_TOP_LETTERS} textAnchor="middle">
              {base}
            </text>
          ))}
          {BOTTOM.map((base, i) => (
            <text key={`b${i}`} className={`helix-base base-${base}`} x={basePairX(i)} y={Y_BOTTOM_LETTERS} textAnchor="middle">
              {base}
            </text>
          ))}

          <line className="helix-ruler" x1={basePairX(0)} x2={basePairX(TOP.length - 1)} y1={Y_RULER_TICK} y2={Y_RULER_TICK} />
          {RULER.map((pos) => (
            <g key={`r${pos}`}>
              <line className="helix-ruler" x1={basePairX(pos - 1)} x2={basePairX(pos - 1)} y1={Y_RULER_TICK} y2={Y_RULER_TICK + 4} />
              <text className="helix-position" x={basePairX(pos - 1)} y={Y_RULER_LABEL} textAnchor="middle">
                {pos}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="helix-caption">
        {caption}{' '}
        <a
          className="text-link"
          href={`https://www.ncbi.nlm.nih.gov/nuccore/${MTDNA_SOURCE.accession}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {sourceLabel}: NCBI {MTDNA_SOURCE.accession}
        </a>
      </figcaption>
    </figure>
  );
}
