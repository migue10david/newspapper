import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosError } from 'axios';
import { createApiClient } from './api';

function createAxiosError(status?: number, message = 'Request failed') {
  const error = new Error(message) as AxiosError<unknown>;
  error.isAxiosError = true;
  error.response = status
    ? ({
        data: { message: 'Backend failure' },
        status,
        statusText: '',
        headers: {},
        config: {},
      } as AxiosError<unknown>['response'])
    : undefined;
  return error;
}

describe('api client', () => {
  it('builds list requests with pagination params', async () => {
    let calledUrl = '';
    let calledParams: Record<string, string | number> | undefined;
    const client = createApiClient('http://api.test', {
      get: async (url, config) => {
        calledUrl = url;
        calledParams = config?.params;
        return { data: { items: [], page: 2, size: 10, total: 0 } };
      },
      post: async () => ({ data: {} }),
    });

    const result = await client.listNews({ page: 2, size: 10 });

    assert.equal(calledUrl, '/public/news');
    assert.deepEqual(calledParams, { page: '2', size: '10' });
    assert.deepEqual(result, { items: [], page: 2, size: 10, total: 0 });
  });

  it('includes category filter when provided', async () => {
    let calledParams: Record<string, string | number> | undefined;
    const client = createApiClient('http://api.test', {
      get: async (_url, config) => {
        calledParams = config?.params;
        return { data: { items: [], page: 1, size: 20, total: 0 } };
      },
      post: async () => ({ data: {} }),
    });

    await client.listNews({ category: 'politica' });

    assert.deepEqual(calledParams, {
      page: '1',
      size: '20',
      category: 'politica',
    });
  });

  it('includes advanced search filters', async () => {
    let calledParams: Record<string, string | number> | undefined;
    const client = createApiClient('http://api.test', {
      get: async (_url, config) => {
        calledParams = config?.params;
        return { data: { items: [], page: 1, size: 20, total: 0 } };
      },
      post: async () => ({ data: {} }),
    });

    await client.listNews({
      q: 'elecciones',
      category: 'politica',
      tag: 'internacional',
      author: 'author-id',
      from: '2026-01-01',
      to: '2026-01-31',
    });

    assert.deepEqual(calledParams, {
      page: '1',
      size: '20',
      category: 'politica',
      q: 'elecciones',
      tag: 'internacional',
      author: 'author-id',
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('returns detail for a slug', async () => {
    let calledUrl = '';
    const client = createApiClient('http://api.test', {
      get: async (url) => {
        calledUrl = url;
        return { data: { id: '1', slug: 'una-noticia' } };
      },
      post: async () => ({ data: {} }),
    });

    const detail = await client.getNewsBySlug('una noticia');

    assert.equal(calledUrl, '/public/news/una%20noticia');
    assert.equal(detail?.slug, 'una-noticia');
  });

  it('returns null when the slug does not exist (404)', async () => {
    const client = createApiClient('http://api.test', {
      get: async () => {
        throw createAxiosError(404, 'Not found');
      },
      post: async () => ({ data: {} }),
    });

    const detail = await client.getNewsBySlug('no-existe');

    assert.equal(detail, null);
  });

  it('includes status and backend message for HTTP errors', async () => {
    const client = createApiClient('http://api.test', {
      get: async () => {
        throw createAxiosError(500);
      },
      post: async () => ({ data: {} }),
    });

    await assert.rejects(
      () => client.listNews({}),
      (error: unknown) =>
        error instanceof Error &&
        error.message === 'API error 500 (http://api.test): Backend failure',
    );
  });

  it('includes the connection error and base URL when the API is unavailable', async () => {
    const client = createApiClient('http://api.test', {
      get: async () => {
        throw createAxiosError(undefined, 'connect ECONNREFUSED');
      },
      post: async () => ({ data: {} }),
    });

    await assert.rejects(
      () => client.listNews({}),
      (error: unknown) =>
        error instanceof Error &&
        error.message ===
          'API error (http://api.test): connect ECONNREFUSED',
    );
  });

  it('uses Axios with the configured base URL and timeout by default', async () => {
    const originalCreate = axios.create;
    let options: Record<string, unknown> | undefined;

    axios.create = ((config) => {
      options = config as Record<string, unknown>;
      return {
        get: async () => ({
          data: { items: [], page: 1, size: 20, total: 0 },
        }),
        post: async () => ({ data: { accessToken: 'access-token' } }),
      } as unknown as ReturnType<typeof axios.create>;
    }) as typeof axios.create;

    try {
      const client = createApiClient('http://configured-api.test');
      await client.listNews({});
    } finally {
      axios.create = originalCreate;
    }

    assert.deepEqual(options, {
      baseURL: 'http://configured-api.test',
      timeout: 10_000,
      withCredentials: true,
      headers: { Accept: 'application/json' },
    });
  });

  it('can refresh the access token using the cookie session', async () => {
    let calledUrl = '';
    const client = createApiClient('http://api.test', {
      get: async () => ({ data: {} }),
      post: async (url) => {
        calledUrl = url;
        return { data: { accessToken: 'new-access-token' } };
      },
    });

    const result = await client.refreshAccessToken();

    assert.equal(calledUrl, '/auth/refresh');
    assert.deepEqual(result, { accessToken: 'new-access-token' });
  });
});
