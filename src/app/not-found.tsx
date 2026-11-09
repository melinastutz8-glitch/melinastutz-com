// The site-wide 404 page, exported as `out/404.html`. nginx serves it for
// every unknown path in either language, so it speaks both. Next adds the
// `noindex` robots tag to this page by itself.
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { mono, sans, serif } from '@/lib/fonts';
import { SITE_VIEWPORT } from '@/lib/seo/metadata';
import de from '@/i18n/messages/de.json';
import en from '@/i18n/messages/en.json';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden | Page not found',
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function NotFound() {
  return (
    <html lang="de" className={`${sans.variable} ${serif.variable} ${mono.variable}`} data-scroll-behavior="smooth">
      <body>
        <main className="not-found container">
          <p className="muted">404</p>
          <h1 className="page-title">{de.notFound.title}</h1>
          <p className="lead">{de.notFound.text}</p>
          <Link href="/de/" className="btn btn-primary">
            {de.notFound.home}
          </Link>
          <div className="not-found-alt" lang="en">
            <h2 className="section-title">{en.notFound.title}</h2>
            <p className="muted">{en.notFound.text}</p>
            <Link href="/en/" className="text-link">
              {en.notFound.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
