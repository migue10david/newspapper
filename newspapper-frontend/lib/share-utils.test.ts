import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCanonicalNewsUrl, getShareLinks } from './share-utils';

describe('share utilities', () => {
  it('builds the canonical public news URL', () => {
    assert.equal(
      buildCanonicalNewsUrl('https://periodico.test/', 'mi noticia'),
      'https://periodico.test/noticia/mi%20noticia',
    );
  });

  it('builds encoded share links for common web channels', () => {
    const links = getShareLinks(
      'https://periodico.test/noticia/mi%20noticia',
      'Mi noticia',
    );
    assert.match(links.whatsapp, /^https:\/\/wa\.me\/\?text=/);
    assert.match(links.x, /^https:\/\/twitter\.com\/intent\/tweet\?/);
    assert.match(links.x, /url=https%3A%2F%2Fperiodico\.test/);
  });
});
