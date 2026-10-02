import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { eq } from 'drizzle-orm';
import { AppModule } from '../app.module';
import { db, pool } from '../database/database';
import {
  authors,
  categories,
  news,
  readingHistory,
  savedNews,
  users,
} from '../database/schema';

interface SavedNewsListResponse {
  items: Array<{ id: string }>;
  page: number;
  size: number;
  total: number;
}

describe('Saved news engagement (e2e)', () => {
  let app: INestApplication<App>;
  let userId: string;
  let secondUserId: string;
  let publishedNewsId: string;
  let secondPublishedNewsId: string;
  let draftNewsId: string;
  let categoryId: string;
  let authorId: string;
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });

  const tokenFor = (id: string, email: string) =>
    `Bearer ${jwt.sign({ sub: id, email, role: 'author' })}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const [category] = await db
      .insert(categories)
      .values({
        name: `Engagement category ${stamp}`,
        slug: `engagement-${stamp}`,
      })
      .returning();
    categoryId = category.id;

    const [author] = await db
      .insert(authors)
      .values({ name: `Engagement author ${stamp}` })
      .returning();
    authorId = author.id;

    const [user] = await db
      .insert(users)
      .values({
        email: `engagement-${stamp}@test.dev`,
        passwordHash: 'not-used-in-test',
        role: 'author',
        authorId,
      })
      .returning();
    userId = user.id;

    const [secondUser] = await db
      .insert(users)
      .values({
        email: `engagement-second-${stamp}@test.dev`,
        passwordHash: 'not-used-in-test',
        role: 'author',
      })
      .returning();
    secondUserId = secondUser.id;

    const [published] = await db
      .insert(news)
      .values({
        title: `Engagement published ${stamp}`,
        slug: `engagement-published-${stamp}`,
        summary: 'Published engagement news',
        body: [{ type: 'paragraph', text: 'Engagement body' }],
        categoryId,
        authorId,
        status: 'published',
        publishedAt: new Date(),
      })
      .returning();
    publishedNewsId = published.id;

    const [secondPublished] = await db
      .insert(news)
      .values({
        title: `Engagement second published ${stamp}`,
        slug: `engagement-second-published-${stamp}`,
        summary: 'Second published engagement news',
        body: [{ type: 'paragraph', text: 'Second engagement body' }],
        categoryId,
        authorId,
        status: 'published',
        publishedAt: new Date(),
      })
      .returning();
    secondPublishedNewsId = secondPublished.id;

    const [draft] = await db
      .insert(news)
      .values({
        title: `Engagement draft ${stamp}`,
        slug: `engagement-draft-${stamp}`,
        summary: 'Draft engagement news',
        body: [{ type: 'paragraph', text: 'Draft body' }],
        categoryId,
        authorId,
        status: 'draft',
      })
      .returning();
    draftNewsId = draft.id;
  });

  afterAll(async () => {
    await db.delete(savedNews).where(eq(savedNews.newsId, publishedNewsId));
    await db
      .delete(readingHistory)
      .where(eq(readingHistory.newsId, publishedNewsId));
    await db
      .delete(readingHistory)
      .where(eq(readingHistory.newsId, secondPublishedNewsId));
    await db.delete(news).where(eq(news.id, publishedNewsId));
    await db.delete(news).where(eq(news.id, secondPublishedNewsId));
    await db.delete(news).where(eq(news.id, draftNewsId));
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(users).where(eq(users.id, secondUserId));
    await db.delete(authors).where(eq(authors.id, authorId));
    await db.delete(categories).where(eq(categories.id, categoryId));
    await app.close();
    await pool.end();
  });

  it('requires authentication and validates pagination', async () => {
    await request(app.getHttpServer()).get('/me/saved-news').expect(401);
    await request(app.getHttpServer())
      .get('/me/saved-news?size=51')
      .set('Authorization', tokenFor(userId, `engagement-${stamp}@test.dev`))
      .expect(400);
  });

  it('saves, repeats idempotently, lists and removes a published news item', async () => {
    const token = tokenFor(userId, `engagement-${stamp}@test.dev`);
    const first = await request(app.getHttpServer())
      .put(`/news/${publishedNewsId}/save`)
      .set('Authorization', token)
      .expect(200);
    expect(first.body).toEqual({ newsId: publishedNewsId, saved: true });

    await request(app.getHttpServer())
      .put(`/news/${publishedNewsId}/save`)
      .set('Authorization', token)
      .expect(200);

    const listed = await request(app.getHttpServer())
      .get('/me/saved-news?page=1&size=20')
      .set('Authorization', token)
      .expect(200);
    const listedBody = listed.body as SavedNewsListResponse;
    expect(listedBody).toMatchObject({ page: 1, size: 20, total: 1 });
    expect(listedBody.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: publishedNewsId }),
      ]),
    );

    await request(app.getHttpServer())
      .delete(`/news/${publishedNewsId}/save`)
      .set('Authorization', token)
      .expect(204);
    const afterRemoval = await request(app.getHttpServer())
      .get('/me/saved-news')
      .set('Authorization', token)
      .expect(200);
    expect((afterRemoval.body as SavedNewsListResponse).total).toBe(0);
  });

  it('keeps saved news isolated per user', async () => {
    const firstToken = tokenFor(userId, `engagement-${stamp}@test.dev`);
    const secondToken = tokenFor(
      secondUserId,
      `engagement-second-${stamp}@test.dev`,
    );
    await request(app.getHttpServer())
      .put(`/news/${publishedNewsId}/save`)
      .set('Authorization', secondToken)
      .expect(200);
    const firstUserList = await request(app.getHttpServer())
      .get('/me/saved-news')
      .set('Authorization', firstToken)
      .expect(200);
    expect((firstUserList.body as SavedNewsListResponse).total).toBe(0);
  });

  it('paginates saved news without duplicating repeated saves', async () => {
    const token = tokenFor(userId, `engagement-${stamp}@test.dev`);
    await request(app.getHttpServer())
      .put(`/news/${publishedNewsId}/save`)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .put(`/news/${secondPublishedNewsId}/save`)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .put(`/news/${secondPublishedNewsId}/save`)
      .set('Authorization', token)
      .expect(200);

    const firstPage = await request(app.getHttpServer())
      .get('/me/saved-news?page=1&size=1')
      .set('Authorization', token)
      .expect(200);
    const firstPageBody = firstPage.body as SavedNewsListResponse;
    expect(firstPageBody).toMatchObject({ page: 1, size: 1, total: 2 });
    expect(firstPageBody.items).toHaveLength(1);

    const secondPage = await request(app.getHttpServer())
      .get('/me/saved-news?page=2&size=1')
      .set('Authorization', token)
      .expect(200);
    expect((secondPage.body as SavedNewsListResponse).items).toHaveLength(1);

    await request(app.getHttpServer())
      .delete(`/news/${publishedNewsId}/save`)
      .set('Authorization', token)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/news/${secondPublishedNewsId}/save`)
      .set('Authorization', token)
      .expect(204);
  });

  it('rejects missing and unpublished news', async () => {
    const token = tokenFor(userId, `engagement-${stamp}@test.dev`);
    await request(app.getHttpServer())
      .put('/news/00000000-0000-0000-0000-000000000001/save')
      .set('Authorization', token)
      .expect(404);
    await request(app.getHttpServer())
      .put(`/news/${draftNewsId}/save`)
      .set('Authorization', token)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/news/${draftNewsId}/save`)
      .set('Authorization', token)
      .expect(404);
  });

  it('records reading idempotently and updates lastReadAt', async () => {
    const token = tokenFor(userId, `engagement-${stamp}@test.dev`);
    const first = await request(app.getHttpServer())
      .post(`/news/${publishedNewsId}/read`)
      .set('Authorization', token)
      .expect(201);
    const firstReadAt = new Date(
      (first.body as { lastReadAt: string }).lastReadAt,
    );

    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = await request(app.getHttpServer())
      .post(`/news/${publishedNewsId}/read`)
      .set('Authorization', token)
      .expect(201);
    const secondReadAt = new Date(
      (second.body as { lastReadAt: string }).lastReadAt,
    );
    expect(secondReadAt.getTime()).toBeGreaterThanOrEqual(
      firstReadAt.getTime(),
    );

    const list = await request(app.getHttpServer())
      .get('/me/reading-history')
      .set('Authorization', token)
      .expect(200);
    const body = list.body as SavedNewsListResponse;
    expect(body.total).toBe(1);
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: publishedNewsId }),
      ]),
    );
  });

  it('isolates, removes and clears reading history', async () => {
    const firstToken = tokenFor(userId, `engagement-${stamp}@test.dev`);
    const secondToken = tokenFor(
      secondUserId,
      `engagement-second-${stamp}@test.dev`,
    );
    await request(app.getHttpServer())
      .post(`/news/${publishedNewsId}/read`)
      .set('Authorization', secondToken)
      .expect(201);

    const firstList = await request(app.getHttpServer())
      .get('/me/reading-history')
      .set('Authorization', firstToken)
      .expect(200);
    expect((firstList.body as SavedNewsListResponse).total).toBe(1);

    await request(app.getHttpServer())
      .delete(`/me/reading-history/${publishedNewsId}`)
      .set('Authorization', firstToken)
      .expect(204);
    const afterEntryRemoval = await request(app.getHttpServer())
      .get('/me/reading-history')
      .set('Authorization', firstToken)
      .expect(200);
    expect((afterEntryRemoval.body as SavedNewsListResponse).total).toBe(0);

    await request(app.getHttpServer())
      .post(`/news/${publishedNewsId}/read`)
      .set('Authorization', firstToken)
      .expect(201);
    await request(app.getHttpServer())
      .delete('/me/reading-history')
      .set('Authorization', firstToken)
      .expect(204);
    const afterClear = await request(app.getHttpServer())
      .get('/me/reading-history')
      .set('Authorization', firstToken)
      .expect(200);
    expect((afterClear.body as SavedNewsListResponse).total).toBe(0);

    const secondList = await request(app.getHttpServer())
      .get('/me/reading-history')
      .set('Authorization', secondToken)
      .expect(200);
    expect((secondList.body as SavedNewsListResponse).total).toBe(1);
  });

  it('requires authentication and rejects invalid or unpublished reads', async () => {
    await request(app.getHttpServer())
      .post(`/news/${publishedNewsId}/read`)
      .expect(401);
    const token = tokenFor(userId, `engagement-${stamp}@test.dev`);
    await request(app.getHttpServer())
      .get('/me/reading-history?size=51')
      .set('Authorization', token)
      .expect(400);
    await request(app.getHttpServer())
      .post(`/news/${draftNewsId}/read`)
      .set('Authorization', token)
      .expect(404);
    await request(app.getHttpServer())
      .post('/news/00000000-0000-0000-0000-000000000001/read')
      .set('Authorization', token)
      .expect(404);
  });

  it('cascades saved news and reading history when users or news are deleted', async () => {
    const secondToken = tokenFor(
      secondUserId,
      `engagement-second-${stamp}@test.dev`,
    );
    await request(app.getHttpServer())
      .put(`/news/${secondPublishedNewsId}/save`)
      .set('Authorization', secondToken)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/news/${secondPublishedNewsId}/read`)
      .set('Authorization', secondToken)
      .expect(201);

    await db.delete(news).where(eq(news.id, secondPublishedNewsId));
    const savedForDeletedNews = await db
      .select()
      .from(savedNews)
      .where(eq(savedNews.newsId, secondPublishedNewsId));
    const historyForDeletedNews = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.newsId, secondPublishedNewsId));
    expect(savedForDeletedNews).toHaveLength(0);
    expect(historyForDeletedNews).toHaveLength(0);

    await db.delete(users).where(eq(users.id, secondUserId));
    const savedForDeletedUser = await db
      .select()
      .from(savedNews)
      .where(eq(savedNews.userId, secondUserId));
    const historyForDeletedUser = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, secondUserId));
    expect(savedForDeletedUser).toHaveLength(0);
    expect(historyForDeletedUser).toHaveLength(0);
  });
});
