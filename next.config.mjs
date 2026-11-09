import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Static export: `next build` writes the whole site to `out/`, and nginx
// serves it (see nginx/default.conf). Nothing here may need a server at
// runtime, so there are no `headers()`, `redirects()` or `rewrites()`:
// security headers, cache rules and the `/` → `/de/` redirect live in nginx.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Every page is `<path>/index.html`; nginx answers `/de/cv` with a 301 to
  // `/de/cv/`, and canonical/sitemap URLs end with a slash to match.
  trailingSlash: true,
  // No runtime image optimisation in a static export.
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
