'use client';

// The glowing DNA eye-catcher: the real right-handed B-DNA of the fiber model
// (src/lib/dna3d), drawn as luminous mint tubes on a deep green-black panel,
// with a soft bloom, a fine sparkle on the strands, two out-of-focus helices
// in the background and floating specks of light. Decorative: no legend, no
// interaction; the canvas carries one aria-label.
//
// Painting, per frame (Canvas 2D, no dependencies):
// 1. a quarter-resolution "far" layer, scaled up so it looks out of focus:
//    background helices and large bokeh specks;
// 2. a quarter-resolution "glow" layer of the main helix, added on top (bloom);
// 3. the main helix itself, sorted far to near: tube runs and rungs with a
//    body, an inner band and a bright highlight, coloured by depth;
// 4. sparkle on the near parts and small sharp specks, added on top.
// Runs only while on screen and the tab is visible; one still frame when the
// visitor prefers reduced motion.
import { useEffect, useRef } from 'react';
import { MTDNA_START } from '@/data/mtdna';
import { buildDuplex, type Duplex } from '@/lib/dna3d/model';
import { fitGlow, glowFrame, type GlowFrame, type GlowPoint, type GlowView, type Placement } from '@/lib/dna3d/glow';

type RGB = [number, number, number];
const BG: RGB = [6, 17, 13];
const DEEP: RGB = [38, 120, 92];
const MINT: RGB = [127, 227, 184];
const LIGHT: RGB = [234, 255, 246];

const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const rgba = ([r, g, b]: RGB, a = 1) => `rgba(${r},${g},${b},${a})`;

/** Radii in Å. */
const TUBE = 1.35;
const RUNG = 0.8;
const QUARTER = 0.25;

type Variant = 'hero' | 'band';

interface Background {
  basePairs: number;
  /** Box size relative to the canvas, and the helix centre in canvas fractions. */
  size: number;
  at: [number, number];
  view: GlowView;
  alpha: number;
  turnMs: number;
}

interface Config {
  basePairs: (width: number) => number;
  view: GlowView;
  margin: number;
  turnMs: number;
  backgrounds: Background[];
  specks: number;
}

const CONFIG: Record<Variant, Config> = {
  hero: {
    basePairs: () => 22,
    view: { spin: 0, tilt: 0.34, pitch: 0.06, roll: -0.42 },
    margin: 28,
    turnMs: 26000,
    backgrounds: [
      { basePairs: 18, size: 0.62, at: [0.8, 0.16], view: { spin: 1.3, tilt: 0.3, pitch: 0, roll: -0.62 }, alpha: 0.5, turnMs: 34000 },
      { basePairs: 20, size: 0.9, at: [0.1, 0.92], view: { spin: 2.4, tilt: 0.28, pitch: 0, roll: -0.3 }, alpha: 0.38, turnMs: 40000 },
    ],
    specks: 46,
  },
  band: {
    basePairs: (w) => Math.max(10, Math.min(30, Math.floor(w / 34))),
    view: { spin: 0, tilt: 0.3, pitch: 0.04, roll: -0.1 },
    margin: 18,
    turnMs: 28000,
    backgrounds: [
      { basePairs: 16, size: 0.7, at: [0.82, 0.2], view: { spin: 1.1, tilt: 0.3, pitch: 0, roll: -0.25 }, alpha: 0.42, turnMs: 36000 },
      { basePairs: 16, size: 0.75, at: [0.18, 0.85], view: { spin: 2.2, tilt: 0.3, pitch: 0, roll: 0.08 }, alpha: 0.32, turnMs: 42000 },
    ],
    specks: 30,
  },
};

interface Speck {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  far: boolean;
}

function makeSpecks(count: number): Speck[] {
  // Fixed pseudo-random sequence, so the panel looks the same on every visit.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, (_, i) => {
    const far = i % 3 === 0;
    return {
      x: rand(),
      y: rand(),
      r: far ? 4 + rand() * 9 : 0.6 + rand() * 1.4,
      vx: (rand() - 0.5) * 0.004,
      vy: -0.002 - rand() * 0.006,
      phase: rand() * Math.PI * 2,
      far,
    };
  });
}

/** Depth 0 (far) … 1 (near) of a point in a frame. */
const depthOf = (p: GlowPoint, f: GlowFrame) => (p.z - f.zMin) / Math.max(1e-6, f.zMax - f.zMin);

function strokeRun(
  ctx: CanvasRenderingContext2D,
  pts: GlowPoint[],
  width: number,
  color: string,
  lift = 0,
  cap: CanvasLineCap = 'round',
) {
  ctx.lineCap = cap;
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y - lift) : ctx.moveTo(q.x, q.y - lift)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

type Piece = { z: number; draw: () => void };

/** The sharp main helix: tube runs and rungs, sorted far to near. */
function paintHelix(ctx: CanvasRenderingContext2D, frame: GlowFrame, place: Placement) {
  const pieces: Piece[] = [];
  const shade = (d: number) => ({
    body: rgba(mix(BG, mix(DEEP, MINT, d), 0.45 + 0.55 * d)),
    band: rgba(mix(BG, mix(MINT, LIGHT, 0.25 * d), 0.35 + 0.65 * d)),
    light: rgba(LIGHT, 0.25 + 0.75 * d),
  });

  for (const strand of frame.strands) {
    let start = 0;
    while (start < strand.length - 1) {
      let end = start + 1;
      while (end < strand.length - 1 && Math.abs(strand[end + 1].z - strand[start].z) < 2.4 && end - start < 30) end++;
      const run = strand.slice(start, end + 1);
      const runStart = start;
      const runEnd = end;
      const z = run.reduce((s, p) => s + p.z, 0) / run.length;
      const f = run.reduce((s, p) => s + p.f, 0) / run.length;
      const d = depthOf(run[Math.floor(run.length / 2)], frame);
      const w = 2 * TUBE * place.scale * f;
      pieces.push({
        z,
        draw: () => {
          const c = shade(d);
          // Flat ends inside the strand, so a run never paints over the
          // highlight of its neighbour (the tube would look dashed); round
          // ends only where the strand itself ends.
          const cap: CanvasLineCap = runStart === 0 || runEnd === strand.length - 1 ? 'round' : 'butt';
          strokeRun(ctx, run, w, c.body, 0, cap);
          strokeRun(ctx, run, w * 0.55, c.band, w * 0.08, cap);
          strokeRun(ctx, run, w * 0.18, c.light, w * 0.22);
        },
      });
      start = end;
    }
  }

  for (const { a, b } of frame.rungs) {
    const f = (a.f + b.f) / 2;
    const w = 2 * RUNG * place.scale * f;
    // Two halves meeting in the middle, with a small gap like paired bases.
    const gap = 0.06;
    const m1 = { x: a.x + (b.x - a.x) * (0.5 - gap), y: a.y + (b.y - a.y) * (0.5 - gap) };
    const m2 = { x: a.x + (b.x - a.x) * (0.5 + gap), y: a.y + (b.y - a.y) * (0.5 + gap) };
    for (const [from, to, z] of [
      [a, m1, a.z],
      [b, m2, b.z],
    ] as const) {
      const d = (z - frame.zMin) / Math.max(1e-6, frame.zMax - frame.zMin);
      pieces.push({
        z: z - 0.5,
        draw: () => {
          const c = shade(d * 0.9);
          ctx.lineCap = 'round';
          for (const [width, color, lift] of [
            [w, c.body, 0],
            [w * 0.5, c.band, w * 0.08],
            [w * 0.16, c.light, w * 0.2],
          ] as const) {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y - lift);
            ctx.lineTo(to.x, to.y - lift);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
          }
        },
      });
    }
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  pieces.sort((p, q) => p.z - q.z).forEach((p) => p.draw());
}

/** Soft version of a helix for the glow and far layers (drawn at quarter resolution). */
function paintSoft(ctx: CanvasRenderingContext2D, frame: GlowFrame, place: Placement, alpha: number, widthScale: number) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const strand of frame.strands) strokeRun(ctx, strand, 2 * TUBE * place.scale * widthScale, rgba(MINT, alpha));
  ctx.lineWidth = 2 * RUNG * place.scale * widthScale;
  ctx.strokeStyle = rgba(MINT, alpha * 0.8);
  ctx.beginPath();
  for (const { a, b } of frame.rungs) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
}

export function DnaGlow({ label, variant }: { label: string; variant: Variant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const config = CONFIG[variant];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const far = document.createElement('canvas');
    const glow = document.createElement('canvas');
    const farCtx = far.getContext('2d')!;
    const glowCtx = glow.getContext('2d')!;
    const specks = makeSpecks(config.specks);
    const backgrounds = config.backgrounds.map((b) => ({ ...b, duplex: buildDuplex(MTDNA_START.slice(0, b.basePairs)) }));

    let width = 0;
    let height = 0;
    let main: { duplex: Duplex; place: Placement } | null = null;
    let backPlaces: Placement[] = [];
    let raf = 0;
    const start = performance.now();
    let onScreen = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const c of [far, glow]) {
        c.width = Math.max(1, Math.round(width * QUARTER));
        c.height = Math.max(1, Math.round(height * QUARTER));
      }
      farCtx.setTransform(QUARTER, 0, 0, QUARTER, 0, 0);
      glowCtx.setTransform(QUARTER, 0, 0, QUARTER, 0, 0);
      const n = config.basePairs(width);
      const duplex = main?.duplex.sequence.length === n ? main.duplex : buildDuplex(MTDNA_START.slice(0, n));
      main = { duplex, place: fitGlow(duplex, config.view, width, height, config.margin) };
      backPlaces = backgrounds.map((b) => {
        const p = fitGlow(b.duplex, b.view, width * b.size, height * b.size, 0);
        return { ...p, cx: p.cx - (width * b.size) / 2 + width * b.at[0], cy: p.cy - (height * b.size) / 2 + height * b.at[1] };
      });
      draw(performance.now());
    };

    const draw = (now: number) => {
      if (!main || !width || !height) return;
      const t = reduceMotion ? 0 : now - start;

      // 1. Far layer: out-of-focus helices and bokeh.
      farCtx.clearRect(0, 0, width, height);
      backgrounds.forEach((b, i) => {
        const frame = glowFrame(b.duplex, { ...b.view, spin: b.view.spin + (t / b.turnMs) * 2 * Math.PI }, backPlaces[i]);
        paintSoft(farCtx, frame, backPlaces[i], b.alpha, 1);
      });
      for (const s of specks) {
        if (!s.far) continue;
        const x = (((s.x + s.vx * (t / 1000)) % 1) + 1) % 1;
        const y = (((s.y + s.vy * (t / 1000)) % 1) + 1) % 1;
        farCtx.beginPath();
        farCtx.arc(x * width, y * height, s.r, 0, Math.PI * 2);
        farCtx.fillStyle = rgba(MINT, 0.18 + 0.12 * Math.sin(s.phase + t / 1700));
        farCtx.fill();
      }

      // 2. Main helix frame and its glow.
      const frame = glowFrame(main.duplex, { ...config.view, spin: config.view.spin + (t / config.turnMs) * 2 * Math.PI }, main.place);
      glowCtx.clearRect(0, 0, width, height);
      paintSoft(glowCtx, frame, main.place, 0.6, 1.7);

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(far, 0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4;
      ctx.drawImage(glow, 0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // 3. The sharp helix.
      paintHelix(ctx, frame, main.place);

      // 4. Sparkle on the near half of the strands, and sharp specks.
      ctx.globalCompositeOperation = 'lighter';
      const mid = (frame.zMin + frame.zMax) / 2;
      frame.strands.forEach((strand, si) => {
        for (let i = 1; i < strand.length - 1; i += 2) {
          const p = strand[i];
          if (p.z < mid) continue;
          const q = strand[i + 1];
          const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
          const w = TUBE * main!.place.scale * p.f;
          const seed = Math.sin((i + 1) * 12.9898 + si * 78.233) * 43758.5453;
          const off = ((seed - Math.floor(seed)) - 0.5) * 1.4 * w;
          const twinkle = 0.5 + 0.5 * Math.sin(seed + t / 420);
          const x = p.x + (-(q.y - p.y) / len) * off;
          const y = p.y + ((q.x - p.x) / len) * off;
          ctx.fillStyle = rgba(LIGHT, 0.12 + 0.5 * twinkle * depthOf(p, frame));
          ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
        }
      });
      for (const s of specks) {
        if (s.far) continue;
        const x = (((s.x + s.vx * (t / 1000)) % 1) + 1) % 1;
        const y = (((s.y + s.vy * (t / 1000)) % 1) + 1) % 1;
        ctx.beginPath();
        ctx.arc(x * width, y * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(LIGHT, 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(s.phase + t / 900)));
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      draw(now);
    };
    const run = () => {
      if (reduceMotion || raf || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) run();
      else stop();
    });
    visibility.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : run());
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [variant]);

  return (
    <div className={`dna-glow dna-glow-${variant}`}>
      <canvas ref={canvasRef} role="img" aria-label={label} />
    </div>
  );
}
