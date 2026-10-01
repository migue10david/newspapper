import { sql } from 'drizzle-orm';
import { db, pool } from './database';

describe('Database schema', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('has all expected tables', async () => {
    const result = await db.execute<{ tableName: string }>(sql`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const names = result.rows.map((r) => r.tableName);
    const expected = [
      'users',
      'authors',
      'categories',
      'tags',
      'media',
      'news',
      'news_tags',
      'comments',
      'news_reactions',
      'site_settings',
    ];
    for (const table of expected) {
      expect(names).toContain(table);
    }
  });

  it('has unique slugs on news, categories and tags', async () => {
    const result = await db.execute<{ indexName: string }>(sql`
      SELECT indexname AS "indexName"
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN ('news_slug_unique', 'categories_slug_unique', 'tags_slug_unique')
    `);
    expect(result.rows).toHaveLength(3);
  });

  it('has news index on status and publishedAt', async () => {
    const result = await db.execute<{ indexName: string }>(sql`
      SELECT indexname AS "indexName"
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'news_status_published_at_idx'
    `);
    expect(result.rows).toHaveLength(1);
  });

  it('has interaction indexes and the unique reaction key', async () => {
    const indexes = await db.execute<{ indexName: string }>(sql`
      SELECT indexname AS "indexName"
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'comments_news_status_created_at_idx',
          'comments_user_id_idx',
          'news_reactions_news_id_idx',
          'news_reactions_user_id_idx'
        )
    `);
    expect(indexes.rows).toHaveLength(4);

    const constraints = await db.execute<{ constraintName: string }>(sql`
      SELECT conname AS "constraintName"
      FROM pg_constraint
      WHERE conrelid = 'news_reactions'::regclass
        AND conname = 'news_reactions_news_id_user_id_pk'
    `);
    expect(constraints.rows).toHaveLength(1);
  });

  it('has the expected interaction enum values', async () => {
    const result = await db.execute<{ typeName: string; value: string }>(sql`
      SELECT t.typname AS "typeName", e.enumlabel AS "value"
      FROM pg_type t
      INNER JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname IN ('comment_status', 'reaction_type')
      ORDER BY t.typname, e.enumsortorder
    `);
    expect(result.rows).toEqual([
      { typeName: 'comment_status', value: 'pending' },
      { typeName: 'comment_status', value: 'published' },
      { typeName: 'comment_status', value: 'hidden' },
      { typeName: 'reaction_type', value: 'like' },
      { typeName: 'reaction_type', value: 'useful' },
    ]);
  });
});
