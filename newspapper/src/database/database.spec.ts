import { sql } from 'drizzle-orm';
import { db, pool } from './database';

describe('Database connection', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('connects using DATABASE_URL', async () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    const result = await db.execute(sql`SELECT 1 AS ok`);
    expect(result.rows[0]).toMatchObject({ ok: 1 });
  });
});
