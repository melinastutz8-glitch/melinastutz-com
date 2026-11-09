import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

// Exported as out/robots.txt at build time.
export const dynamic = 'force-static';

// Content Signals (contentsignals.org), same decision as furchert-ch: search
// and AI answers yes, AI training no. Cloudflare's managed robots.txt, if
// Dominic enables it, is prepended and never sets ai-input, so it comes from
// here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      other: { 'Content-Signal': 'search=yes, ai-input=yes, ai-train=no' },
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
