import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type AxiosInstance } from 'axios';
import { createNewsApi } from './news-api';

function createMockClient() {
  const calls: Array<{ method: string; url: string; body?: unknown; params?: unknown }> = [];
  const client = {
    get: async (url: string, config?: { params?: unknown }) => {
      calls.push({ method: 'GET', url, params: config?.params });
      return { data: [] };
    },
    post: async (url: string, body: unknown) => {
      calls.push({ method: 'POST', url, body });
      return { data: { id: '1', version: 2 } };
    },
    patch: async (url: string, body: unknown) => {
      calls.push({ method: 'PATCH', url, body });
      return { data: { id: '1', version: 2 } };
    },
  } as unknown as AxiosInstance;
  return { client, calls };
}

describe('news api', () => {
  it('builds authenticated listing, creation, update and transition requests', async () => {
    const mock = createMockClient();
    const api = createNewsApi(mock.client);
    const input = {
      title: 'Noticia',
      summary: 'Resumen',
      body: [{ type: 'paragraph' as const, text: 'Contenido' }],
      categoryId: 'category-1',
      tagIds: [],
    };

    await api.listNews('inReview');
    await api.createNews(input);
    await api.updateNews('1', { ...input, version: 1 });
    await api.transitionNews('1', 'published', 2);

    assert.deepEqual(mock.calls, [
      { method: 'GET', url: '/news', params: { status: 'inReview' } },
      { method: 'POST', url: '/news', body: input },
      { method: 'PATCH', url: '/news/1', body: { ...input, version: 1 } },
      { method: 'POST', url: '/news/1/transition', body: { target: 'published', version: 2 } },
    ]);
  });
});
