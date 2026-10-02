import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAdminNavigationGroups } from './navigation-config';

describe('navigation config', () => {
  it('keeps editorial links available for every authenticated role', () => {
    const links = getAdminNavigationGroups('author').flatMap((group) => group.items.filter((item) => item.visible).map((item) => item.href));
    assert.deepEqual(links, ['/admin', '/admin/news']);
  });

  it('shows community and catalog management to editors', () => {
    const links = getAdminNavigationGroups('editor').flatMap((group) => group.items.filter((item) => item.visible).map((item) => item.href));
    assert.deepEqual(links, ['/admin', '/admin/news', '/admin/comments', '/admin/catalog']);
  });

  it('shows all management sections only to administrators', () => {
    const links = getAdminNavigationGroups('admin').flatMap((group) => group.items.filter((item) => item.visible).map((item) => item.href));
    assert.deepEqual(links, ['/admin', '/admin/news', '/admin/comments', '/admin/catalog', '/admin/users', '/admin/settings']);
  });
});
