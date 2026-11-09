'use client';

// Interactive 3D model of the first base pairs of the human mitochondrial
// genome as ideal B-DNA (all heavy atoms of the Chandrasekaran & Arnott fiber
// model, src/lib/dna3d/model.ts), painted on a canvas with depth sorting,
// perspective, depth cueing and simple lighting (src/lib/dna3d/render.ts).
//
// Representation: the "tube and ring" cartoon of molecular graphics programs
// (backbone tubes through the real P atoms, ending at the last O3', in the
// colour of their strand, phosphorus atoms as spheres, base rings filled in the NDB colours
// A red, C yellow, G green, T blue, Watson–Crick hydrogen bonds dashed).
//
// - Turns slowly about its axis; drag (or arrow keys) to rotate and tilt.
// - Paints only while on screen and the tab is visible; no automatic turning
//   when the visitor prefers reduced motion.
// - The sequence below is plain HTML, readable without JavaScript.
import { useEffect, useRef } from 'react';
import { MTDNA_SOURCE, MTDNA_START } from '@/data/mtdna';
import { buildDuplex, type Duplex } from '@/lib/dna3d/model';
import { drawList, fitViewport, project, toCamera, type ColorKey, type View } from '@/lib/dna3d/render';

const TURN_MS = 30000;
const DEFAULT_VIEW: View = { spin: 0.6, tilt: 0.42, pitch: 0 };
const FOG_STEPS = 8;
/** Share of the background mixed into the farthest parts (depth cueing). */
const FOG_MAX = 0.6;

const COLOR_VARS: Record<ColorKey, string> = {
  strand1: '--accent',
  strand2: '--dna-strand-2',
  P: '--dna-p',
  A: '--dna-a',
  C: '--dna-c-fill',
  G: '--dna-g',
  T: '--dna-t',
  hbond: '--text-3',
};

type RGB = [number, number, number];

function parseColor(value: string): RGB {
  const hex = value.trim().replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(hex)) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
  const m = value.match(/\d+(\.\d+)?/g);
  return m ? ([Number(m[0]), Number(m[1]), Number(m[2])] as RGB) : [128, 128, 128];
}
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const css = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;

interface Palette {
  /** fog level → colour */
  fill: Record<ColorKey, string[]>;
  dark: Record<ColorKey, string[]>;
  light: Record<ColorKey, string[]>;
  label: string;
  halo: string;
  font: string;
}

function readPalette(el: Element): Palette {
  const style = getComputedStyle(el);
  const bg = parseColor(style.getPropertyValue('--bg'));
  const isDark = bg[0] + bg[1] + bg[2] < 3 * 128;
  const fill = {} as Palette['fill'];
  const dark = {} as Palette['dark'];
  const light = {} as Palette['light'];
  for (const key of Object.keys(COLOR_VARS) as ColorKey[]) {
    const token = parseColor(style.getPropertyValue(COLOR_VARS[key]));
    // The tokens are text colours (contrast ≥ 4.5:1); as surfaces they read
    // better a little lighter on paper.
    const base = isDark ? token : mix(token, [255, 255, 255], 0.18);
    const outline = mix(token, [0, 0, 0], isDark ? 0.55 : 0.35);
    const highlight = mix(base, [255, 255, 255], 0.45);
    fill[key] = [];
    dark[key] = [];
    light[key] = [];
    for (let i = 0; i < FOG_STEPS; i++) {
      const t = (i / (FOG_STEPS - 1)) * FOG_MAX;
      fill[key].push(css(mix(base, bg, t)));
      dark[key].push(css(mix(outline, bg, t)));
      light[key].push(css(mix(highlight, bg, t)));
    }
  }
  const mono = style.getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';
  return {
    fill,
    dark,
    light,
    label: style.getPropertyValue('--text-2').trim(),
    halo: css(bg),
    font: `11px ${mono}`,
  };
}

function basePairsFor(width: number): number {
  return Math.max(12, Math.min(MTDNA_START.length, Math.floor(width / 24)));
}

function paint(
  ctx: CanvasRenderingContext2D,
  duplex: Duplex,
  view: View,
  width: number,
  height: number,
  pal: Palette,
) {
  const vp = fitViewport(width, height, duplex.sequence.length, view);
  const list = drawList(duplex, view, vp);
  ctx.clearRect(0, 0, width, height);
  if (!list.length) return;
  const zNear = list[list.length - 1].z;
  const zFar = list[0].z;
  const fogOf = (z: number) =>
    Math.round(((zNear - z) / Math.max(1e-6, zNear - zFar)) * (FOG_STEPS - 1));

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of list) {
    const fog = fogOf(p.z);
    if (p.kind === 'tube') {
      // A shaded tube: dark rim, body, and a thin highlight towards the light (top).
      const trace = (lift: number) => {
        ctx.beginPath();
        p.points.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y - lift) : ctx.moveTo(q.x, q.y - lift)));
      };
      trace(0);
      ctx.strokeStyle = pal.dark[p.color][fog];
      ctx.lineWidth = p.width + 1.5;
      ctx.stroke();
      ctx.strokeStyle = pal.fill[p.color][fog];
      ctx.lineWidth = p.width;
      ctx.stroke();
      trace(p.width * 0.22);
      ctx.strokeStyle = pal.light[p.color][fog];
      ctx.lineWidth = p.width * 0.28;
      ctx.stroke();
    } else if (p.kind === 'stick') {
      ctx.beginPath();
      ctx.moveTo(p.a.x, p.a.y);
      ctx.lineTo(p.b.x, p.b.y);
      ctx.strokeStyle = pal.dark[p.color][fog];
      ctx.lineWidth = p.width + 1.2;
      ctx.stroke();
      ctx.strokeStyle = pal.fill[p.color][fog];
      ctx.lineWidth = p.width;
      ctx.stroke();
    } else if (p.kind === 'ring') {
      ctx.beginPath();
      p.points.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
      // Faces turned to the viewer get the full colour, edge-on faces the rim colour.
      ctx.fillStyle = p.light > 0.3 ? pal.fill[p.color][fog] : pal.dark[p.color][fog];
      ctx.fill();
      ctx.strokeStyle = pal.dark[p.color][fog];
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (p.kind === 'hbond') {
      ctx.beginPath();
      ctx.moveTo(p.a.x, p.a.y);
      ctx.lineTo(p.b.x, p.b.y);
      ctx.setLineDash([2, 2.5]);
      ctx.strokeStyle = pal.fill.hbond[fog];
      ctx.lineWidth = p.width;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const { x, y } = p.c;
      const g = ctx.createRadialGradient(x - p.r * 0.35, y - p.r * 0.35, p.r * 0.1, x, y, p.r);
      g.addColorStop(0, pal.light.P[fog]);
      g.addColorStop(0.55, pal.fill.P[fog]);
      g.addColorStop(1, pal.dark.P[fog]);
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  // 5′ / 3′ labels at the strand ends, pushed outwards horizontally.
  ctx.font = pal.font;
  ctx.textBaseline = 'middle';
  for (const end of duplex.ends) {
    const q = project(toCamera(end.at, view), vp);
    const left = q.x < width / 2;
    const text = end.prime === "5'" ? '5′' : '3′';
    ctx.textAlign = left ? 'right' : 'left';
    const x = q.x + (left ? -10 : 10);
    ctx.lineWidth = 3;
    ctx.strokeStyle = pal.halo;
    ctx.strokeText(text, x, q.y);
    ctx.fillStyle = pal.label;
    ctx.fillText(text, x, q.y);
  }
}

export interface DnaModelProps {
  label: string;
  hint: string;
  caption: string;
  sourceLabel: string;
  modelSource: string;
  legend: { title: string; A: string; C: string; G: string; T: string; P: string; strand1: string; strand2: string };
}

export function DnaModel({ label, hint, caption, sourceLabel, modelSource, legend }: DnaModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const view: View = { ...DEFAULT_VIEW };
    let pal = readPalette(canvas);
    let width = 0;
    let height = 0;
    let duplex: Duplex | null = null;
    let raf = 0;
    let last = 0;
    let onScreen = false;
    let dragging = false;

    const draw = () => {
      if (duplex && width && height) paint(ctx, duplex, view, width, height, pal);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = basePairsFor(width);
      if (!duplex || duplex.sequence.length !== n) duplex = buildDuplex(MTDNA_START.slice(0, n));
      draw();
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last && !dragging) view.spin += ((now - last) / TURN_MS) * 2 * Math.PI;
      last = now;
      draw();
    };
    const start = () => {
      if (reduceMotion || raf || !onScreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Drag to rotate about the axis (horizontal) and to tilt (vertical).
    let px = 0;
    let py = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      view.spin += (e.clientX - px) * 0.012;
      view.pitch = Math.max(-0.8, Math.min(0.8, view.pitch + (e.clientY - py) * 0.008));
      px = e.clientX;
      py = e.clientY;
      if (!raf) draw();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const onKey = (e: KeyboardEvent) => {
      const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key];
      if (!step) return;
      e.preventDefault();
      view.spin += step[0];
      view.pitch = Math.max(-0.8, Math.min(0.8, view.pitch + step[1]));
      if (!raf) draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    visibility.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      pal = readPalette(canvas);
      draw();
    };
    scheme.addEventListener('change', onScheme);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('keydown', onKey);
    resize();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      scheme.removeEventListener('change', onScheme);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('keydown', onKey);
    };
  }, []);

  // GenBank-style readout: blocks of ten bases, the position of each block's first base.
  const blocks: { start: number; bases: string }[] = [];
  for (let i = 0; i < MTDNA_START.length; i += 10) blocks.push({ start: i + 1, bases: MTDNA_START.slice(i, i + 10) });

  return (
    <figure className="dna">
      <canvas ref={canvasRef} className="dna-canvas" tabIndex={0} role="img" aria-label={`${label}. ${hint}`} />
      <p className="dna-sequence" aria-label={`5′ ${MTDNA_START} 3′`}>
        <span className="dna-end" aria-hidden="true">
          5′
        </span>
        {blocks.map((b) => (
          <span className="dna-block" key={b.start} aria-hidden="true">
            <span className="dna-pos">{b.start}</span>
            {b.bases.split('').map((base, i) => (
              <span key={i} className={`dna-base base-${base}`}>
                {base}
              </span>
            ))}
          </span>
        ))}
        <span className="dna-end" aria-hidden="true">
          3′
        </span>
      </p>
      <figcaption className="dna-caption">
        <ul className="dna-legend" aria-label={legend.title}>
          {(['A', 'C', 'G', 'T'] as const).map((b) => (
            <li key={b}>
              <span className={`dna-swatch base-${b}`} aria-hidden="true" />
              {legend[b]}
            </li>
          ))}
          <li>
            <span className="dna-swatch dna-swatch-p" aria-hidden="true" />
            {legend.P}
          </li>
          <li>
            <span className="dna-line dna-line-1" aria-hidden="true" />
            {legend.strand1}
          </li>
          <li>
            <span className="dna-line dna-line-2" aria-hidden="true" />
            {legend.strand2}
          </li>
        </ul>
        <p>
          {caption} {hint}
        </p>
        <p className="dna-sources">
          {sourceLabel}:{' '}
          <a className="text-link" href={`https://www.ncbi.nlm.nih.gov/nuccore/${MTDNA_SOURCE.accession}`} target="_blank" rel="noopener noreferrer">
            NCBI {MTDNA_SOURCE.accession}
          </a>
          {' · '}
          {modelSource}
        </p>
      </figcaption>
    </figure>
  );
}
