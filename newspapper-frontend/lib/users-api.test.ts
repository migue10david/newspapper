import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';
import { UsersApiError, createUsersApi } from './users-api';

function createMockClient() {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  const client = {
    get: async (url: string) => {
      calls.push({ method: 'GET', url });
      return { data: [{ id: '1', email: 'admin@test.dev', role: 'admin' }] };
    },
    post: async (url: string, body: unknown) => {
      calls.push({ method: 'POST', url, body });
      return { data: { id: '2', email: 'editor@test.dev', role: 'editor' } };
    },
    patch: async (url: string, body: unknown) => {
      calls.push({ method: 'PATCH', url, body });
      return { data: { id: '1', email: 'admin@test.dev', role: 'editor' } };
    },
  } as unknown as AxiosInstance;

  return { client, calls };
}

describe('users api', () => {
  it('builds list, create and role update requests', async () => {
    const mock = createMockClient();
    const api = createUsersApi(mock.client);

    await api.listUsers();
    await api.createUser({
      email: 'editor@test.dev',
      password: 'password-123',
      role: 'editor',
    });
    await api.updateUserRole('1', 'editor');
    await api.updateUserAuthor('1', 'author-profile-1');

    assert.deepEqual(mock.calls, [
      { method: 'GET', url: '/users' },
      {
        method: 'POST',
        url: '/users',
        body: { email: 'editor@test.dev', password: 'password-123', role: 'editor' },
      },
      { method: 'PATCH', url: '/users/1/role', body: { role: 'editor' } },
      { method: 'PATCH', url: '/users/1/author', body: { authorId: 'author-profile-1' } },
    ]);
  });

  it('preserves API status for role management errors', async () => {
    const error = new AxiosError('Forbidden', 'ERR_BAD_RESPONSE', undefined, undefined, {
      data: { message: 'You cannot change your own role' },
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    const client = {
      get: async () => {
        throw error;
      },
    } as unknown as AxiosInstance;
    const api = createUsersApi(client);

    await assert.rejects(
      () => api.listUsers(),
      (received: unknown) =>
        received instanceof UsersApiError && received.status === 403,
    );
  });
});
