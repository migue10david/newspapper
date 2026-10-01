import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAuthStore } from './auth-store';
import type { AuthClient } from './auth-client';

function tokenFor(role: 'author' | 'editor' | 'admin') {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ email: `${role}@test.dev`, role })}.signature`;
}

function createClient(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    login: async () => ({ accessToken: tokenFor('admin') }),
    register: async () => ({
      id: 'user-id',
      email: 'author@test.dev',
      role: 'author',
    }),
    refreshAccessToken: async () => ({ accessToken: tokenFor('admin') }),
    logout: async () => undefined,
    ...overrides,
  };
}

describe('auth store', () => {
  it('stores the access token and role only in the in-memory store', async () => {
    const store = createAuthStore(createClient());

    await store.getState().login({ email: 'admin@test.dev', password: 'secret' });

    assert.equal(store.getState().accessToken, tokenFor('admin'));
    assert.equal(store.getState().email, 'admin@test.dev');
    assert.equal(store.getState().role, 'admin');
    assert.equal(store.getState().isInitialized, true);
    assert.equal('persist' in store, false);
  });

  it('identifies non-admin roles for public navigation', async () => {
    const store = createAuthStore(
      createClient({ login: async () => ({ accessToken: tokenFor('author') }) }),
    );

    await store.getState().login({ email: 'author@test.dev', password: 'secret' });

    assert.equal(store.getState().role, 'author');
    assert.notEqual(store.getState().role, 'admin');
  });

  it('refreshes the token and clears the session when refresh fails', async () => {
    let shouldFail = false;
    const store = createAuthStore(
      createClient({
        refreshAccessToken: async () => {
          if (shouldFail) {
            throw new Error('expired');
          }

          return { accessToken: tokenFor('editor') };
        },
      }),
    );

    assert.equal(await store.getState().refresh(), true);
    assert.equal(store.getState().role, 'editor');

    shouldFail = true;
    assert.equal(await store.getState().refresh(), false);
    assert.equal(store.getState().accessToken, null);
    assert.equal(store.getState().email, null);
    assert.equal(store.getState().role, null);
  });

  it('always clears the local session on logout', async () => {
    let logoutCalls = 0;
    const store = createAuthStore(
      createClient({
        logout: async () => {
          logoutCalls += 1;
          throw new Error('network failure');
        },
      }),
    );
    store.getState().setSession(tokenFor('admin'));

    await assert.rejects(() => store.getState().logout(), /network failure/);
    assert.equal(logoutCalls, 1);
    assert.equal(store.getState().accessToken, null);
    assert.equal(store.getState().email, null);
    assert.equal(store.getState().role, null);
  });
});
