import { describe, expect, it } from 'vitest';
import { buildHomeJsonLd, buildProfilePageJsonLd, PERSON_ID, serializeJsonLd, WEBSITE_ID } from './jsonLd';

const input = {
  locale: 'de' as const,
  pageUrl: 'https://melinastutz.com/de/',
  name: 'Start',
  description: 'Beschreibung',
  dateModified: '2026-11-08',
};

const graph = (data: Record<string, unknown>) => data['@graph'] as Array<Record<string, unknown>>;

describe('buildHomeJsonLd', () => {
  it('describes the site, the page and the person with stable ids', () => {
    const nodes = graph(buildHomeJsonLd(input));
    expect(nodes.map((n) => n['@type'])).toEqual(['WebSite', 'WebPage', 'Person']);
    expect(nodes[0]['@id']).toBe(WEBSITE_ID);
    expect(nodes[1]).toMatchObject({ url: input.pageUrl, inLanguage: 'de', about: { '@id': PERSON_ID } });
    expect(nodes[2]).toMatchObject({ '@id': PERSON_ID, name: 'Melina Stutz' });
  });

  it('never exposes e-mail, phone or street address', () => {
    const json = JSON.stringify(buildHomeJsonLd(input));
    expect(json).not.toMatch(/email|telephone|streetAddress|@melinastutz/i);
  });
});

describe('buildProfilePageJsonLd', () => {
  it('nests the person as the main entity of the CV page', () => {
    const [page] = graph(buildProfilePageJsonLd({ ...input, pageUrl: 'https://melinastutz.com/de/cv/' }));
    expect(page['@type']).toBe('ProfilePage');
    expect(page.mainEntity).toMatchObject({ '@id': PERSON_ID });
  });
});

describe('serializeJsonLd', () => {
  it('escapes characters that could close the script element', () => {
    expect(serializeJsonLd({ a: '</script><b>\u2028\u2029' })).toBe('{"a":"\\u003c/script>\\u003cb>\\u2028\\u2029"}');
  });
});
