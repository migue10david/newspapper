import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import 'dotenv/config';
import { AppModule } from '../app.module';
import { db, pool } from '../database/database';
import { eq } from 'drizzle-orm';
import { authors, news, users } from '../database/schema';
import { UsersService } from '../users/users.service';

describe('News management (e2e)', () => {
  let app: INestApplication<App>;

  const login = async (email: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'devpassword' })
      .expect(200);
    return `Bearer ${(res.body as { accessToken: string }).accessToken}`;
  };

  const newDto = (suffix: string) => ({
    title: `Noticia ${suffix}`,
    summary: 'Resumen',
    body: [{ type: 'paragraph', text: 'Contenido' }],
    categorySlug: 'general',
  });

  const createNews = async (
    token: string,
    suffix: string,
    authorName?: string,
  ) => {
    const cats = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);
    const categoryId = (cats.body as Array<{ slug: string; id: string }>).find(
      (c) => c.slug === 'general',
    )?.id;
    const authors = await request(app.getHttpServer())
      .get('/authors')
      .set('Authorization', await login('admin@periodico.dev'))
      .expect(200);
    const list = authors.body as Array<{ id: string; name: string }>;
    const authorId = authorName
      ? list.find((a) => a.name === authorName)?.id
      : list[0].id;
    const res = await request(app.getHttpServer())
      .post('/news')
      .set('Authorization', token)
      .send({ ...newDto(suffix), categoryId, authorId })
      .expect(201);
    return res.body as { id: string; slug: string; version: number };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new (await import('@nestjs/common')).ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('requires auth on management endpoints', async () => {
    await request(app.getHttpServer()).post('/news').send({}).expect(401);
  });

  it('searches managed news with pagination and role visibility', async () => {
    const authorToken = await login('author@periodico.dev');
    const created = await createNews(
      authorToken,
      `manage-search-${Date.now()}`,
      'Redacción',
    );
    const authorResult = await request(app.getHttpServer())
      .get('/news/manage?q=manage-search&size=50')
      .set('Authorization', authorToken)
      .expect(200);
    const authorBody = authorResult.body as {
      items: Array<{ id: string }>;
      page: number;
      size: number;
    };
    expect(authorBody.page).toBe(1);
    expect(authorBody.size).toBe(50);
    expect(authorBody.items.map((item) => item.id)).toContain(created.id);

    const editorResult = await request(app.getHttpServer())
      .get('/news/manage?status=draft&size=10')
      .set('Authorization', await login('editor@periodico.dev'))
      .expect(200);
    expect(editorResult.body).toHaveProperty('items');
  });

  it('validates managed search parameters and requires authentication', async () => {
    await request(app.getHttpServer()).get('/news/manage').expect(401);
    await request(app.getHttpServer())
      .get('/news/manage?from=not-a-date')
      .set('Authorization', await login('editor@periodico.dev'))
      .expect(400);
  });

  it('returns 400 on invalid DTO', async () => {
    const token = await login('admin@periodico.dev');
    await request(app.getHttpServer())
      .post('/news')
      .set('Authorization', token)
      .send({ title: '' })
      .expect(400);
  });

  it('author cannot publish (403 on transition to published)', async () => {
    const token = await login('author@periodico.dev');
    const item = await createNews(token, `pub-${Date.now()}`, 'Redacción');
    await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', token)
      .send({ target: 'inReview', version: item.version })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', token)
      .send({ target: 'published', version: item.version + 1 })
      .expect(403);
  });

  it('author creates with the linked profile and editor cannot create', async () => {
    const adminToken = await login('admin@periodico.dev');
    const authorToken = await login('author@periodico.dev');
    const usersResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', adminToken)
      .expect(200);
    const authorUser = (
      usersResponse.body as Array<{ email: string; authorId: string | null }>
    ).find((user) => user.email === 'author@periodico.dev');
    expect(authorUser?.authorId).toEqual(expect.any(String));

    const categoriesResponse = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);
    const categoryId = (
      categoriesResponse.body as Array<{ slug: string; id: string }>
    ).find((category) => category.slug === 'general')?.id;
    const otherAuthorResponse = await request(app.getHttpServer())
      .post('/authors')
      .set('Authorization', adminToken)
      .send({ name: `Otro autor ${Date.now()}` })
      .expect(201);
    const otherAuthor = otherAuthorResponse.body as { id: string };

    const created = await request(app.getHttpServer())
      .post('/news')
      .set('Authorization', authorToken)
      .send({
        ...newDto(`owner-${Date.now()}`),
        categoryId,
        authorId: otherAuthor.id,
      })
      .expect(201);
    expect((created.body as { authorId: string }).authorId).toBe(
      authorUser?.authorId,
    );

    await request(app.getHttpServer())
      .post('/news')
      .set('Authorization', await login('editor@periodico.dev'))
      .send({ ...newDto(`editor-create-${Date.now()}`), categoryId })
      .expect(403);
  });

  it('editor can publish; invalid transition returns 409', async () => {
    const token = await login('editor@periodico.dev');
    const adminToken = await login('admin@periodico.dev');
    const item = await createNews(adminToken, `tr-${Date.now()}`);
    // draft -> published is invalid per matrix
    await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', token)
      .send({ target: 'published', version: item.version })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', token)
      .send({ target: 'inReview', version: item.version })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', token)
      .send({ target: 'published', version: item.version + 1 })
      .expect(200);
  });

  it('admin can publish a news item after review', async () => {
    const adminToken = await login('admin@periodico.dev');
    const item = await createNews(adminToken, `admin-publish-${Date.now()}`);
    const review = await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', adminToken)
      .send({ target: 'inReview', version: item.version })
      .expect(200);
    const reviewBody = review.body as { version: number };
    const published = await request(app.getHttpServer())
      .post(`/news/${item.id}/transition`)
      .set('Authorization', adminToken)
      .send({ target: 'published', version: reviewBody.version })
      .expect(200);
    const publishedBody = published.body as {
      status: string;
      publishedAt: string | null;
    };
    expect(publishedBody.status).toBe('published');
    expect(publishedBody.publishedAt).toBeTruthy();
  });

  it('deletes only drafts: published -> 409, owner author ok', async () => {
    const authorToken = await login('author@periodico.dev');
    const item = await createNews(
      authorToken,
      `del-${Date.now()}`,
      'Redacción',
    );
    await db
      .update(news)
      .set({ status: 'published' })
      .where(eq(news.id, item.id));
    await request(app.getHttpServer())
      .delete(`/news/${item.id}`)
      .set('Authorization', authorToken)
      .expect(409);
    await db.update(news).set({ status: 'draft' }).where(eq(news.id, item.id));
    await request(app.getHttpServer())
      .delete(`/news/${item.id}`)
      .set('Authorization', authorToken)
      .expect(204);
  });

  it('author cannot delete news of another author (403)', async () => {
    const profile = await db
      .insert(authors)
      .values({ name: `Other profile ${Date.now()}` })
      .returning();
    const otherUser = await new UsersService().create({
      email: `other-author-${Date.now()}@test.dev`,
      password: 'devpassword',
      role: 'author',
    });
    await db
      .update(users)
      .set({ authorId: profile[0].id })
      .where(eq(users.id, otherUser.id));
    const item = await createNews(
      await login(otherUser.email),
      `other-${Date.now()}`,
    );
    const authorToken = await login('author@periodico.dev');
    await request(app.getHttpServer())
      .delete(`/news/${item.id}`)
      .set('Authorization', authorToken)
      .expect(403);
  });
});
