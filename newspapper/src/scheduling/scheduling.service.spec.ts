import { db, pool } from '../database/database';
import { authors, categories, news } from '../database/schema';
import { SchedulingService } from './scheduling.service';

describe('SchedulingService', () => {
  const service = new SchedulingService();
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  let categoryId: string;
  let authorId: string;

  const insertNews = async (
    slugSuffix: string,
    status: string,
    publishedAt: Date | null,
  ) => {
    const [row] = await db
      .insert(news)
      .values({
        title: `Job ${slugSuffix} ${stamp}`,
        slug: `job-${slugSuffix}-${stamp}`,
        summary: 'S',
        body: [{ type: 'paragraph', text: 'x' }],
        categoryId,
        authorId,
        status: status as 'scheduled',
        publishedAt,
      })
      .returning();
    return row;
  };

  beforeAll(async () => {
    const [category] = await db
      .insert(categories)
      .values({ name: `JobCat-${stamp}`, slug: `jobcat-${stamp}` })
      .returning();
    categoryId = category.id;
    const [author] = await db
      .insert(authors)
      .values({ name: `JobAutor-${stamp}` })
      .returning();
    authorId = author.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('publishes scheduled news whose publishedAt has passed', async () => {
    const past = await insertNews(
      'past',
      'scheduled',
      new Date(Date.now() - 60_000),
    );
    const future = await insertNews(
      'future',
      'scheduled',
      new Date(Date.now() + 3_600_000),
    );
    const draft = await insertNews('draft', 'draft', null);

    const publishedCount = await service.publishDueScheduled();

    expect(publishedCount).toBeGreaterThanOrEqual(1);

    const [pastAfter] = await db
      .select()
      .from(news)
      .then((rows) => rows.filter((r) => r.id === past.id));
    const [futureAfter] = await db
      .select()
      .from(news)
      .then((rows) => rows.filter((r) => r.id === future.id));
    const [draftAfter] = await db
      .select()
      .from(news)
      .then((rows) => rows.filter((r) => r.id === draft.id));

    expect(pastAfter.status).toBe('published');
    expect(futureAfter.status).toBe('scheduled');
    expect(draftAfter.status).toBe('draft');
    expect(pastAfter.publishedAt).not.toBeNull();
  });
});
