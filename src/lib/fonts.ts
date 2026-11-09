import { DM_Mono, DM_Sans, Newsreader } from 'next/font/google';

// next/font downloads the files at build time and serves them from
// /_next/static/media, so visitors never contact Google.
// DM Sans for the interface, Newsreader for headlines only, DM Mono for the
// lab-notebook dates only (DM Sans has no tabular figures).
export const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});
