// The site-wide 404 page, exported as `out/404.html`. nginx serves it for
// every unknown path in either language, so it speaks both.
import type { Metadata } from 'next';
import Link from 'next/link';
import { sans, serif } from '@/lib/fonts';
import de from '@/i18n/messages/de.json';
import en from '@/i18n/messages/en.json';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden | Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <html lang="de" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <main className="not-found container">
          <p className="date">404</p>
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
