import { getRequestConfig } from 'next-intl/server';
import { routing, isLocale } from './routing';

// Pages call `setRequestLocale(locale)` before any next-intl function, so the
// locale comes from the route param and every page renders statically.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
