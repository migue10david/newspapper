import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';
import { AuthApiError, createAuthClient } from './auth-client';

function createHttpClient(response: unknown, error?: unknown) {
  let calledUrl = '';
  let calledBody: unknown;
  const client = {
    post: async (url: string, body?: unknown) => {
      calledUrl = url;
      calledBody = body;
      if (error) {
        throw error;
      }
      return { data: response };
    },
  } as unknown as AxiosInstance;

  return {
    client,
    getRequest: () => ({ url: calledUrl, body: calledBody }),
  };
}

describe('auth client registration', () => {
  it('posts only email and password to the public registration endpoint', async () => {
    const mock = createHttpClient({
      id: 'user-id',
      email: 'author@test.dev',
      role: 'author',
    });
    const client = createAuthClient(mock.client);

    const result = await client.register({
      email: 'author@test.dev',
      password: 'password-123',
    });

    assert.equal(mock.getRequest().url, '/auth/register');
    assert.deepEqual(mock.getRequest().body, {
      email: 'author@test.dev',
      password: 'password-123',
    });
    assert.deepEqual(result, {
      id: 'user-id',
      email: 'author@test.dev',
      role: 'author',
    });
  });

  it('preserves the conflict status for a duplicated email', async () => {
    const error = new AxiosError('Conflict', 'ERR_BAD_RESPONSE', undefined, undefined, {
      data: { message: 'Email already registered' },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    const mock = createHttpClient(undefined, error);
    const client = createAuthClient(mock.client);

    await assert.rejects(
      () => client.register({ email: 'duplicate@test.dev', password: 'password-123' }),
      (received: unknown) =>
        received instanceof AuthApiError &&
        received.status === 409 &&
        received.message.includes('Email already registered'),
    );
  });
});
