import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AxiosInstance } from 'axios';
import { createInteractionsApi } from './interactions-api';

describe('interactions api', () => {
  it('builds public and authenticated interaction requests', async () => {
    const calls: Array<{ method: string; url: string; body?: unknown }> = [];
    const client = {
      get: async (url: string) => {
        calls.push({ method: 'GET', url });
        return { data: { comments: [], reactions: { like: 0, useful: 0 }, totalComments: 0 } };
      },
      post: async (url: string, body: unknown) => {
        calls.push({ method: 'POST', url, body });
        return { data: { id: 'comment-1' } };
      },
      patch: async (url: string, body: unknown) => {
        calls.push({ method: 'PATCH', url, body });
        return { data: { id: 'comment-1' } };
      },
      put: async (url: string, body: unknown) => {
        calls.push({ method: 'PUT', url, body });
        return { data: { type: 'like' } };
      },
      delete: async (url: string) => {
        calls.push({ method: 'DELETE', url });
        return { data: undefined };
      },
    } as unknown as AxiosInstance;
    const api = createInteractionsApi(client, client);

    await api.getPublic('noticia especial');
    await api.createComment('news-1', 'Comentario');
    await api.updateComment('comment-1', { body: 'Actualizado', version: 1 });
    await api.setReaction('news-1', 'like');
    await api.removeReaction('news-1');
    await api.removeComment('comment-1');
    await api.listManageComments({ page: 2, size: 10, status: 'pending' });
    await api.moderateComment('comment-1', { status: 'published', version: 1 });

    assert.deepEqual(calls, [
      { method: 'GET', url: '/public/news/noticia%20especial/interactions' },
      { method: 'POST', url: '/news/news-1/comments', body: { body: 'Comentario' } },
      { method: 'PATCH', url: '/comments/comment-1', body: { body: 'Actualizado', version: 1 } },
      { method: 'PUT', url: '/news/news-1/reaction', body: { type: 'like' } },
      { method: 'DELETE', url: '/news/news-1/reaction' },
      { method: 'DELETE', url: '/comments/comment-1' },
      { method: 'GET', url: '/comments/manage' },
      { method: 'PATCH', url: '/comments/comment-1/moderation', body: { status: 'published', version: 1 } },
    ]);
  });
});
