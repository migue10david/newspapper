import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { db, pool } from '../database/database';
import { eq } from 'drizzle-orm';
import { news } from '../database/schema';

describe('News comments (e2e)', () => {
  let app: INestApplication<App>;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'devpassword' })
      .expect(200);
    return `Bearer ${(response.body as { accessToken: string }).accessToken}`;
  };

  const publishedNews = async (): Promise<{ id: string; slug: string }> => {
    const response = await request(app.getHttpServer())
      .get('/public/news?size=50')
      .expect(200);
    const item = (
      response.body as { items: Array<{ id: string; slug: string }> }
    ).items[0];
    if (!item) {
      throw new Error('The test database needs a published news item');
    }
    return item;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('requires authentication and validates comment input', async () => {
    const item = await publishedNews();
    await request(app.getHttpServer())
      .post(`/news/${item.id}/comments`)
      .send({ body: 'Sin sesión' })
      .expect(401);

    await request(app.getHttpServer())
      .post(`/news/${item.id}/comments`)
      .set('Authorization', await login('author@periodico.dev'))
      .send({ body: '' })
      .expect(400);
  });

  it('creates, edits and logically deletes an own pending comment', async () => {
    const item = await publishedNews();
    const token = await login('author@periodico.dev');
    const created = await request(app.getHttpServer())
      .post(`/news/${item.id}/comments`)
      .set('Authorization', token)
      .send({ body: 'Comentario pendiente' })
      .expect(201);
    const comment = created.body as {
      id: string;
      status: string;
      version: number;
    };
    expect(comment.status).toBe('pending');
    expect(comment.version).toBe(1);

    const updated = await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set('Authorization', token)
      .send({ body: 'Comentario corregido', version: comment.version })
      .expect(200);
    expect(updated.body).toMatchObject({ status: 'pending', version: 2 });

    await request(app.getHttpServer())
      .delete(`/comments/${comment.id}`)
      .set('Authorization', token)
      .expect(204);

    const publicResponse = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(
      (publicResponse.body as { comments: Array<{ id: string }> }).comments,
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: comment.id })]),
    );
  });

  it('prevents editing another user comment and detects stale versions', async () => {
    const item = await publishedNews();
    const editorToken = await login('editor@periodico.dev');
    const authorToken = await login('author@periodico.dev');
    const created = await request(app.getHttpServer())
      .post(`/news/${item.id}/comments`)
      .set('Authorization', editorToken)
      .send({ body: 'Comentario de editor' })
      .expect(201);
    const comment = created.body as { id: string; version: number };

    await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set('Authorization', authorToken)
      .send({ body: 'No autorizado', version: comment.version })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set('Authorization', editorToken)
      .send({ body: 'Versión obsoleta', version: 99 })
      .expect(409);
  });

  it('allows editor moderation and exposes only published comments publicly', async () => {
    const item = await publishedNews();
    const authorToken = await login('author@periodico.dev');
    const editorToken = await login('editor@periodico.dev');
    const created = await request(app.getHttpServer())
      .post(`/news/${item.id}/comments`)
      .set('Authorization', authorToken)
      .send({ body: 'Comentario para moderar' })
      .expect(201);
    const comment = created.body as { id: string; version: number };

    const hiddenFromPublic = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(
      (hiddenFromPublic.body as { comments: Array<{ id: string }> }).comments,
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: comment.id })]),
    );

    await request(app.getHttpServer())
      .get('/comments/manage?status=pending&size=50')
      .set('Authorization', editorToken)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/comments/${comment.id}/moderation`)
      .set('Authorization', editorToken)
      .send({ status: 'published', version: comment.version })
      .expect(200);

    const visible = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(
      (visible.body as { comments: Array<{ id: string }> }).comments,
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: comment.id })]),
    );
  });

  it('rejects author moderation and comments for unpublished news', async () => {
    const authorToken = await login('author@periodico.dev');
    await request(app.getHttpServer())
      .get('/comments/manage')
      .set('Authorization', authorToken)
      .expect(403);

    const [draft] = await db
      .select({ id: news.id })
      .from(news)
      .where(eq(news.status, 'draft'))
      .limit(1);
    if (draft) {
      await request(app.getHttpServer())
        .post(`/news/${draft.id}/comments`)
        .set('Authorization', authorToken)
        .send({ body: 'No debería publicarse' })
        .expect(404);
    }
  });

  it('creates, changes, counts and removes one reaction per user and news', async () => {
    const item = await publishedNews();
    const token = await login('author@periodico.dev');
    const before = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    const beforeCounts = (
      before.body as { reactions: { like: number; useful: number } }
    ).reactions;

    await request(app.getHttpServer())
      .put(`/news/${item.id}/reaction`)
      .set('Authorization', token)
      .send({ type: 'like' })
      .expect(200);
    const afterLike = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(
      (afterLike.body as { reactions: { like: number } }).reactions.like,
    ).toBe(beforeCounts.like + 1);

    await request(app.getHttpServer())
      .put(`/news/${item.id}/reaction`)
      .set('Authorization', token)
      .send({ type: 'like' })
      .expect(200);
    const afterIdempotent = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(
      (afterIdempotent.body as { reactions: { like: number } }).reactions.like,
    ).toBe(beforeCounts.like + 1);

    await request(app.getHttpServer())
      .put(`/news/${item.id}/reaction`)
      .set('Authorization', token)
      .send({ type: 'useful' })
      .expect(200);
    const afterChange = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(afterChange.body).toMatchObject({
      reactions: {
        like: beforeCounts.like,
        useful: beforeCounts.useful + 1,
      },
    });

    await request(app.getHttpServer())
      .delete(`/news/${item.id}/reaction`)
      .set('Authorization', token)
      .expect(204);
    const afterRemove = await request(app.getHttpServer())
      .get(`/public/news/${item.slug}/interactions`)
      .expect(200);
    expect(afterRemove.body).toMatchObject({ reactions: beforeCounts });
  });

  it('rejects anonymous, invalid and unpublished reactions', async () => {
    const item = await publishedNews();
    await request(app.getHttpServer())
      .put(`/news/${item.id}/reaction`)
      .send({ type: 'like' })
      .expect(401);

    const token = await login('author@periodico.dev');
    await request(app.getHttpServer())
      .put(`/news/${item.id}/reaction`)
      .set('Authorization', token)
      .send({ type: 'love' })
      .expect(400);

    const [draft] = await db
      .select({ id: news.id })
      .from(news)
      .where(eq(news.status, 'draft'))
      .limit(1);
    if (draft) {
      await request(app.getHttpServer())
        .put(`/news/${draft.id}/reaction`)
        .set('Authorization', token)
        .send({ type: 'like' })
        .expect(404);
    }
  });
});
