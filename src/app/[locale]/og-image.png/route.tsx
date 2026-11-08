// Share image (Open Graph and Twitter) of every page in one locale, rendered
// once at build time to `out/<locale>/og-image.png`. A route handler with the
// extension in its path, not the `opengraph-image` convention: that one
// exports a file without extension, which nginx would serve as
// application/octet-stream. buildPageMetadata links the image on every page.
// Text only, in the site palette (globals.css, light mode), set in the
// default font bundled with next/og, so the build needs no network either.
import { ImageResponse } from 'next/og';
import { isLocale, routing } from '@/i18n/routing';
import { SHARE_IMAGE_SIZE } from '@/lib/seo/metadata';
import { shareImageText } from '@/lib/seo/pageMetadata';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const PAPER = '#f7f6f1'; // --bg
const TEXT = '#1d221e'; // --text
const TEXT_2 = '#535b54'; // --text-2
const SAGE = '#47705a'; // --accent

/**
 * Text as one element per letter. Satori (behind next/og) lays text out with
 * unkerned glyph widths but draws it kerned, which leaves a visible gap after
 * words such as "Universität"; single letters have no kerning pairs, so layout
 * and drawing agree. Needs a flex parent with `whiteSpace: 'pre'`.
 */
function letters(text: string) {
  return Array.from(text).map((char, i) => <span key={i}>{char}</span>);
}

const line = { display: 'flex', whiteSpace: 'pre' } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response(null, { status: 404 });
  const { name, tagline, status } = await shareImageText(locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: PAPER,
          color: TEXT,
        }}
      >
        <div style={{ width: 64, height: 4, background: SAGE, marginBottom: 48 }} />
        <div style={{ ...line, fontSize: 96, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{letters(name)}</div>
        <div style={{ ...line, marginTop: 24, fontSize: 44, lineHeight: 1.3, color: TEXT_2 }}>{letters(tagline)}</div>
        <div style={{ ...line, marginTop: 48, alignItems: 'center', fontSize: 40, color: SAGE }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: SAGE, marginRight: 20 }} />
          {letters(status)}
        </div>
      </div>
    ),
    SHARE_IMAGE_SIZE,
  );
}
