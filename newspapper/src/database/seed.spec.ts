import { sql } from 'drizzle-orm';
import { db, pool } from './database';
import { runSeed } from './seed';

describe('Seed', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('is idempotent (targeted counts unchanged after second run)', async () => {
    await runSeed();
    const targetedCounts = async () => {
      const result = await db.execute<{ key: string; count: number }>(sql`
        SELECT 'users' AS key, count(*)::int AS count FROM users
          WHERE email IN ('admin@periodico.dev', 'editor@periodico.dev', 'author@periodico.dev')
        UNION ALL
        SELECT 'categories', count(*)::int FROM categories WHERE slug = 'general'
        UNION ALL
        SELECT 'tags', count(*)::int FROM tags WHERE slug IN ('local', 'opinion')
        ORDER BY key
      `);
      return Object.fromEntries(result.rows.map((r) => [r.key, r.count]));
    };

    const first = await targetedCounts();
    expect(first).toEqual({ users: 3, categories: 1, tags: 2 });

    await runSeed();
    const second = await targetedCounts();
    expect(second).toEqual(first);
  });

  it('seeds the expected roles with hashed passwords', async () => {
    const result = await db.execute<{ email: string; passwordHash: string }>(
      sql`SELECT email, password_hash AS "passwordHash" FROM users
          WHERE email IN ('admin@periodico.dev', 'editor@periodico.dev', 'author@periodico.dev')`,
    );
    expect(result.rows).toHaveLength(3);
    for (const row of result.rows) {
      expect(row.passwordHash).not.toContain('password');
      expect(row.passwordHash.length).toBeGreaterThan(20);
    }
  });
});
