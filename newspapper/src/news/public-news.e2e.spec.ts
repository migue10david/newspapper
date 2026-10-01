import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { eq } from 'drizzle-orm';
import { AppModule } from '../app.module';
import { db, pool } from '../database/database';
import { authors, categories, news, tags, newsTags } from '../database/schema';

describe('Public news endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const seed = async () => {
    const [category] = await db
      .insert(categories)
      .values({ name: `PubCat-${stamp}`, slug: `pubcat-${stamp}` })
      .returning();
    const [otherCategory] = await db
      .insert(categories)
      .values({ name: `OtraCat-${stamp}`, slug: `otracat-${stamp}` })
      .returning();
    const [author] = await db
      .insert(authors)
      .values({ name: `PubAutor-${stamp}` })
      .returning();
    const [tag] = await db
      .insert(tags)
      .values({ name: `PubTag-${stamp}`, slug: `pubtag-${stamp}` })
      .returning();

    const make = (title: string, status: string, publishedAt?: Date) =>
      db
        .insert(news)
        .values({
          title,
          slug: `${title.toLowerCase().replace(/\s+/g, '-')}-${stamp}`,
          summary: `Resumen ${title}`,
          body: [{ type: 'paragraph', text: `Texto ${title}` }],
          categoryId: category.id,
          authorId: author.id,
          status: status as 'draft',
          publishedAt,
        })
        .returning();

    const [recent] = await make(
      'PubRecent',
      'published',
      new Date('2099-01-10T10:00:00Z'),
    );
    const [older] = await make(
      'PubOlder',
      'published',
      new Date('2099-01-05T10:00:00Z'),
    );
    const [draftOne] = await make('PubDraft', 'draft');
    await make(
      'PubOtherCat',
      'published',
      new Date('2099-01-08T10:00:00Z'),
    ).then(async ([n]) => {
      await db
        .update(news)
        .set({ categoryId: otherCategory.id })
        .where(eq(news.id, n.id));
    });
    await db.insert(newsTags).values({ newsId: recent.id, tagId: tag.id });

    return { category, otherCategory, author, recent, older, draftOne };
  };

  let ctx: Awaited<ReturnType<typeof seed>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    ctx = await seed();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('lists published news ordered by publishedAt desc with pagination metadata', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/news?page=1&size=50')
      .expect(200);
    const body = res.body as {
      items: Array<{ id: string; status?: string; publishedAt?: string }>;
      page: number;
      size: number;
      total: number;
    };
    expect(body.page).toBe(1);
    expect(body.size).toBe(50);
    expect(body.total).toBeGreaterThanOrEqual(3);
    const ids = body.items.map((i) => i.id);
    const idxRecent = ids.indexOf(ctx.recent.id);
    const idxOlder = ids.indexOf(ctx.older.id);
    expect(idxRecent).toBeGreaterThanOrEqual(0);
    expect(idxOlder).toBeGreaterThanOrEqual(0);
    expect(idxRecent).toBeLessThan(idxOlder);
    expect(ids).not.toContain(ctx.draftOne.id);
    expect(body.items.every((i) => !('body' in i))).toBe(true);
  });

  it('filters by category slug', async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/news?category=${ctx.category.slug}&size=50`)
      .expect(200);
    const items = (res.body as { items: Array<{ id: string }> }).items;
    const ids = items.map((i) => i.id);
    expect(ids).toContain(ctx.recent.id);
    expect(ids).toContain(ctx.older.id);
    expect(ids).not.toContain(ctx.draftOne.id);
    // the one in the other category must not appear
    const all = await request(app.getHttpServer())
      .get('/public/news?size=50')
      .expect(200);
    const otherId = (
      all.body as { items: Array<{ id: string; slug: string }> }
    ).items.find((i) => i.slug === `pubothercat-${stamp}`)?.id;
    expect(ids).not.toContain(otherId);
  });

  it('filters public news by text, tag and date range', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/public/news?q=PubRecent&tag=${ctx.category.slug.replace('cat', 'tag')}&from=2099-01-01&to=2099-01-31&size=50`,
      )
      .expect(200);
    const items = (res.body as { items: Array<{ id: string }> }).items;
    expect(items.map((item) => item.id)).toContain(ctx.recent.id);
    expect(items.map((item) => item.id)).not.toContain(ctx.older.id);
  });

  it('returns full detail by slug including body and tags', async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/news/${ctx.recent.slug}`)
      .expect(200);
    const body = res.body as {
      slug: string;
      body: Array<{ type: string }>;
      tags: Array<{ slug: string }>;
      category: { slug: string };
      author: { name: string };
    };
    expect(body.slug).toBe(ctx.recent.slug);
    expect(body.body[0].type).toBe('paragraph');
    expect(body.tags.some((t) => t.slug.startsWith('pubtag-'))).toBe(true);
    expect(body.category.slug).toBe(ctx.category.slug);
    expect(body.author.name).toBe(`PubAutor-${stamp}`);
  });

  it('returns 404 for draft/archived/missing slug', async () => {
    await request(app.getHttpServer())
      .get(`/public/news/${ctx.draftOne.slug}`)
      .expect(404);
    await request(app.getHttpServer())
      .get('/public/news/no-existe-este-slug')
      .expect(404);
  });

  it('returns 400 on invalid pagination params', async () => {
    await request(app.getHttpServer()).get('/public/news?size=51').expect(400);
    await request(app.getHttpServer()).get('/public/news?size=0').expect(400);
    await request(app.getHttpServer()).get('/public/news?page=0').expect(400);
  });

  it('returns empty list with 200 when page is out of range', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/news?page=999999&size=50')
      .expect(200);
    expect((res.body as { items: unknown[] }).items).toEqual([]);
  });

  it('works without authentication', async () => {
    await request(app.getHttpServer()).get('/public/news').expect(200);
  });
});
