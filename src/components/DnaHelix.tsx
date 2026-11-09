'use client';

// A slowly turning DNA double helix made of the first 48 base pairs of the
// human mitochondrial genome (src/data/mtdna.ts), drawn as SVG.
//
// - The server renders a still first frame, so the helix is there without
//   JavaScript and the first client render matches it.
// - In the browser, one requestAnimationFrame loop (about 30 frames per
//   second) moves the phase and rewrites the path data through refs, without
//   React re-renders.
// - The loop runs only while the helix is on screen and the tab is visible,
//   and not at all when the visitor prefers reduced motion.
// - The base letters stay put above and below as a 5′ → 3′ readout.
import { useEffect, useRef } from 'react';
import { complement, MTDNA_START } from '@/data/mtdna';
import { basePairX, formatCoordinate as f, HELIX, helixWidth, rung, strandPaths } from '@/lib/helix';

const TOP = MTDNA_START.split('');
const BOTTOM = complement(MTDNA_START).split('');
const WIDTH = helixWidth(TOP.length);
/** One full turn every 16 s. */
const RADIANS_PER_MS = (2 * Math.PI) / 16000;
const FRAME_MS = 1000 / 30;

export function DnaHelix({ label, caption }: { label: string; caption: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const a0 = strandPaths(0, 1, WIDTH);
  const b0 = strandPaths(0, -1, WIDTH);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const aFront = svg.querySelector<SVGPathElement>('[data-part="a-front"]');
    const aBack = svg.querySelector<SVGPathElement>('[data-part="a-back"]');
    const bFront = svg.querySelector<SVGPathElement>('[data-part="b-front"]');
    const bBack = svg.querySelector<SVGPathElement>('[data-part="b-back"]');
    const rungs = Array.from(svg.querySelectorAll<SVGLineElement>('[data-part="rung"]'));

    let phase = 0;
    let last = 0;
    let lastDraw = 0;
    let raf = 0;
    let onScreen = false;

    const draw = () => {
      const a = strandPaths(phase, 1, WIDTH);
      const b = strandPaths(phase, -1, WIDTH);
      aFront?.setAttribute('d', a.front);
      aBack?.setAttribute('d', a.back);
      bFront?.setAttribute('d', b.front);
      bBack?.setAttribute('d', b.back);
      rungs.forEach((line, i) => {
        const r = rung(i, phase);
        line.setAttribute('y1', f(r.ya));
        line.setAttribute('y2', f(r.yb));
      });
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last) phase -= (now - last) * RADIANS_PER_MS;
      last = now;
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
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
          <path data-part="a-back" className="helix-strand helix-strand-a is-back" d={a0.back} />
          <path data-part="b-back" className="helix-strand helix-strand-b is-back" d={b0.back} />
          {TOP.map((_, i) => {
            const r = rung(i, 0);
            return <line key={i} data-part="rung" className="helix-rung" x1={r.x} x2={r.x} y1={f(r.ya)} y2={f(r.yb)} />;
          })}
          <path data-part="a-front" className="helix-strand helix-strand-a is-front" d={a0.front} />
          <path data-part="b-front" className="helix-strand helix-strand-b is-front" d={b0.front} />

          <text className="helix-end" x={12} y={20}>
            5′
          </text>
          <text className="helix-end" x={12} y={HELIX.height - 8}>
            3′
          </text>
          <text className="helix-end" x={WIDTH - 12} y={20} textAnchor="end">
            3′
          </text>
          <text className="helix-end" x={WIDTH - 12} y={HELIX.height - 8} textAnchor="end">
            5′
          </text>
          {TOP.map((base, i) => (
            <text key={`t${i}`} className="helix-base helix-base-top" x={basePairX(i)} y={20} textAnchor="middle">
              {base}
            </text>
          ))}
          {BOTTOM.map((base, i) => (
            <text
              key={`b${i}`}
              className="helix-base helix-base-bottom"
              x={basePairX(i)}
              y={HELIX.height - 8}
              textAnchor="middle"
            >
              {base}
            </text>
          ))}
        </svg>
      </div>
      <figcaption className="helix-caption">{caption}</figcaption>
    </figure>
  );
}
