import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';
import { createAuthenticatedApiClient } from './authenticated-api';

function createMockClient() {
  let requestHandler: ((config: unknown) => unknown) | undefined;
  let responseErrorHandler: ((error: unknown) => Promise<unknown>) | undefined;
  const requests: unknown[] = [];

  const client = {
    interceptors: {
      request: { use: (handler: (config: unknown) => unknown) => (requestHandler = handler) },
      response: {
        use: (_success: unknown, handler: (error: unknown) => Promise<unknown>) => {
          responseErrorHandler = handler;
        },
      },
    },
    request: async (config: unknown) => {
      requests.push(config);
      return { data: { ok: true } };
    },
  } as unknown as AxiosInstance;

  return {
    client,
    requests,
    getRequestHandler: () => requestHandler,
    getResponseErrorHandler: () => responseErrorHandler,
  };
}

describe('authenticated api client', () => {
  it('adds the current access token as a bearer header', () => {
    const mock = createMockClient();
    const store = {
      getState: () => ({ accessToken: 'access-token', refresh: async () => true }),
    };
    createAuthenticatedApiClient(mock.client, store);

    const config = { headers: new AxiosHeaders(), url: '/news' };
    mock.getRequestHandler()?.(config);

    assert.equal(config.headers.get('Authorization'), 'Bearer access-token');
  });

  it('refreshes once and retries a protected request after a 401', async () => {
    const mock = createMockClient();
    let refreshCalls = 0;
    const store = {
      getState: () => ({
        accessToken: 'old-token',
        refresh: async () => {
          refreshCalls += 1;
          return true;
        },
      }),
    };
    createAuthenticatedApiClient(mock.client, store);

    const config = {
      headers: new AxiosHeaders(),
      url: '/news',
      method: 'get',
    };
    const error = new AxiosError(
      'Unauthorized',
      'ERR_BAD_RESPONSE',
      config,
      undefined,
      { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config },
    );

    const result = await mock.getResponseErrorHandler()?.(error);

    assert.deepEqual(result, { data: { ok: true } });
    assert.equal(refreshCalls, 1);
    assert.equal(mock.requests.length, 1);
    assert.equal((config as { _authRetry?: boolean })._authRetry, true);
  });
});
