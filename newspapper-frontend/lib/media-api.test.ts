import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type AxiosInstance } from 'axios';
import { createMediaApi, resolveMediaUrl } from './media-api';

describe('media api', () => {
  it('uploads a file with its alternative text as multipart form data', async () => {
    let body: FormData | undefined;
    const client = {
      post: async (_url: string, payload: FormData) => {
        body = payload;
        return { data: { id: 'media-1', url: '/uploads/one.png', mime: 'image/png', size: 3, alt: 'Una imagen' } };
      },
    } as unknown as AxiosInstance;
    const file = new File(['png'], 'one.png', { type: 'image/png' });

    await createMediaApi(client).upload(file, 'Una imagen');

    assert.ok(body);
    assert.equal(body.get('alt'), 'Una imagen');
    assert.equal((body.get('file') as File).name, 'one.png');
  });

  it('resolves relative backend media URLs without changing absolute URLs', () => {
    assert.equal(resolveMediaUrl('/uploads/one.png'), 'http://localhost:3001/uploads/one.png');
    assert.equal(resolveMediaUrl('https://cdn.example.com/one.png'), 'https://cdn.example.com/one.png');
    assert.equal(resolveMediaUrl(null), null);
  });
});
