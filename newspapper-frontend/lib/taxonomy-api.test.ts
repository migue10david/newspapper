import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type AxiosInstance } from 'axios';
import { createTaxonomyApi } from './taxonomy-api';

describe('taxonomy api', () => {
  it('builds management listing and mutation requests', async () => {
    const calls: Array<{ method: string; url: string; body?: unknown; config?: unknown }> = [];
    const client = {
      get: async (url: string, config?: unknown) => {
        calls.push({ method: 'GET', url, config });
        return { data: { items: [], page: 1, size: 10, total: 0 } };
      },
      post: async (url: string, body: unknown) => {
        calls.push({ method: 'POST', url, body });
        return { data: { id: '1', name: 'Local', slug: 'local' } };
      },
      patch: async (url: string, body: unknown) => {
        calls.push({ method: 'PATCH', url, body });
        return { data: { id: '1', name: 'Local', slug: 'local' } };
      },
      delete: async (url: string) => {
        calls.push({ method: 'DELETE', url });
        return { data: undefined };
      },
    } as unknown as AxiosInstance;
    const api = createTaxonomyApi(client);

    await api.manage('categories', { page: 2, size: 10, search: 'loc' });
    await api.create('categories', { name: 'Local', slug: 'local' });
    await api.update('categories', '1', { name: 'Local', slug: 'local' });
    await api.remove('categories', '1');

    assert.deepEqual(calls, [
      { method: 'GET', url: '/categories/manage', config: { params: { page: 2, size: 10, search: 'loc' } } },
      { method: 'POST', url: '/categories', body: { name: 'Local', slug: 'local' } },
      { method: 'PATCH', url: '/categories/1', body: { name: 'Local', slug: 'local' } },
      { method: 'DELETE', url: '/categories/1' },
    ]);
  });
});
