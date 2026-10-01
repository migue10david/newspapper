import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { eq } from 'drizzle-orm';
import { AppModule } from '../app.module';
import { db, pool } from '../database/database';
import { authors, categories, news } from '../database/schema';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Media (e2e)', () => {
  let app: INestApplication<App>;

  const login = async (email: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'devpassword' })
      .expect(200);
    return `Bearer ${(res.body as { accessToken: string }).accessToken}`;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('uploads a valid image and returns its record', async () => {
    const token = await login('editor@periodico.dev');
    const res = await request(app.getHttpServer())
      .post('/media')
      .set('Authorization', token)
      .attach('file', PNG_1PX, {
        filename: 'pixel.png',
        contentType: 'image/png',
      })
      .expect(201);
    const body = res.body as { id: string; url: string; mime: string };
    expect(body.url).toMatch(/^\/uploads\/.+\.png$/);
    expect(body.mime).toBe('image/png');
    expect(body.id).toBeDefined();
  });

  it('rejects non-image mime types with 400', async () => {
    const token = await login('editor@periodico.dev');
    await request(app.getHttpServer())
      .post('/media')
      .set('Authorization', token)
      .attach('file', Buffer.from('hello'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('rejects files over 5MB with 400', async () => {
    const token = await login('editor@periodico.dev');
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    await request(app.getHttpServer())
      .post('/media')
      .set('Authorization', token)
      .attach('file', big, { filename: 'big.png', contentType: 'image/png' })
      .expect(400);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/media')
      .attach('file', PNG_1PX, { filename: 'a.png', contentType: 'image/png' })
      .expect(401);
  });

  it('deletes a media and unsets referencing news image (tolerant)', async () => {
    const token = await login('admin@periodico.dev');
    const upload = await request(app.getHttpServer())
      .post('/media')
      .set('Authorization', token)
      .attach('file', PNG_1PX, {
        filename: 'ref.png',
        contentType: 'image/png',
      })
      .expect(201);
    const mediaId = (upload.body as { id: string }).id;

    const stamp = Date.now();
    const [category] = await db
      .insert(categories)
      .values({ name: `MediaCat-${stamp}`, slug: `mediacat-${stamp}` })
      .returning();
    const [author] = await db
      .insert(authors)
      .values({ name: `MediaAutor-${stamp}` })
      .returning();
    const [newsRow] = await db
      .insert(news)
      .values({
        title: `Media news ${stamp}`,
        slug: `media-news-${stamp}`,
        summary: 'S',
        body: [{ type: 'paragraph', text: 'x' }],
        categoryId: category.id,
        authorId: author.id,
        imageId: mediaId,
      })
      .returning();

    await request(app.getHttpServer())
      .delete(`/media/${mediaId}`)
      .set('Authorization', token)
      .expect(204);

    const [after] = await db
      .select()
      .from(news)
      .where(eq(news.id, newsRow.id))
      .limit(1);
    expect(after.imageId).toBeNull();
  });

  it('returns 404 deleting a missing media', async () => {
    const token = await login('admin@periodico.dev');
    await request(app.getHttpServer())
      .delete('/media/00000000-0000-0000-0000-000000000000')
      .set('Authorization', token)
      .expect(404);
  });
});
