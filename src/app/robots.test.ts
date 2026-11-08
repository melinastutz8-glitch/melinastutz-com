import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('allows everything, sets the content signals and names the sitemap', () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        other: { 'Content-Signal': 'search=yes, ai-input=yes, ai-train=no' },
      },
      sitemap: 'https://melinastutz.com/sitemap.xml',
    });
  });
});
