import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AxiosInstance } from 'axios';
import { createEngagementApi } from './engagement-api';

describe('engagement api', () => {
  it('builds authenticated save, history and reading requests', async () => {
    const calls: Array<{ method: string; url: string; config?: unknown }> = [];
    const client = {
      get: async (url: string, config?: unknown) => {
        calls.push({ method: 'GET', url, config });
        return { data: { items: [], page: 1, size: 20, total: 0 } };
      },
      post: async (url: string) => {
        calls.push({ method: 'POST', url });
        return { data: { newsId: 'news-1', read: true, lastReadAt: '2026-01-01' } };
      },
      put: async (url: string) => {
        calls.push({ method: 'PUT', url });
        return { data: { newsId: 'news-1', saved: true } };
      },
      delete: async (url: string) => {
        calls.push({ method: 'DELETE', url });
        return { data: undefined };
      },
    } as unknown as AxiosInstance;
    const api = createEngagementApi(client);

    await api.saveNews('news-1');
    await api.removeSavedNews('news-1');
    await api.listSavedNews({ page: 2, size: 10 });
    await api.recordReading('news-1');
    await api.listReadingHistory({ page: 1, size: 10 });
    await api.removeReadingHistory('news-1');
    await api.clearReadingHistory();

    assert.deepEqual(calls, [
      { method: 'PUT', url: '/news/news-1/save' },
      { method: 'DELETE', url: '/news/news-1/save' },
      { method: 'GET', url: '/me/saved-news', config: { params: { page: 2, size: 10 } } },
      { method: 'POST', url: '/news/news-1/read' },
      { method: 'GET', url: '/me/reading-history', config: { params: { page: 1, size: 10 } } },
      { method: 'DELETE', url: '/me/reading-history/news-1' },
      { method: 'DELETE', url: '/me/reading-history' },
    ]);
  });
});
