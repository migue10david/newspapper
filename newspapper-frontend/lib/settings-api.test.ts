import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type AxiosInstance } from 'axios';
import { createSettingsApi } from './settings-api';

describe('settings api', () => {
  it('reads public settings and updates them through the authenticated endpoint', async () => {
    const calls: Array<{ method: string; url: string; body?: unknown }> = [];
    const settings = { siteName: 'Diario', description: 'Noticias', logoUrl: null };
    const client = {
      get: async (url: string) => {
        calls.push({ method: 'GET', url });
        return { data: settings };
      },
      patch: async (url: string, body: unknown) => {
        calls.push({ method: 'PATCH', url, body });
        return { data: body };
      },
    } as unknown as AxiosInstance;
    const api = createSettingsApi(client);

    await api.get();
    await api.update(settings);

    assert.deepEqual(calls, [
      { method: 'GET', url: '/public/settings' },
      { method: 'PATCH', url: '/settings', body: settings },
    ]);
  });
});
