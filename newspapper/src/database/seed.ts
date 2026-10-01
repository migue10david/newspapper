import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, pool } from './database';
import { authors, categories, siteSettings, tags, users } from './schema';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'devpassword';

const SEED_USERS = [
  { email: 'admin@periodico.dev', role: 'admin' as const },
  { email: 'editor@periodico.dev', role: 'editor' as const },
  { email: 'author@periodico.dev', role: 'author' as const },
];

const SEED_CATEGORIES = [{ name: 'General', slug: 'general' }];
const SEED_TAGS = [
  { name: 'Local', slug: 'local' },
  { name: 'Opinión', slug: 'opinion' },
];
const DEFAULT_SITE_SETTINGS = {
  id: 1,
  siteName: 'Periódico',
  description: 'Periódico digital de noticias',
  logoUrl: null,
};

export async function runSeed(): Promise<void> {
  const passwordHash = await hash(SEED_PASSWORD, 10);

  const [seedAuthor] = await db
    .insert(authors)
    .values({ name: 'Redacción' })
    .onConflictDoNothing({ target: authors.name })
    .returning();

  const authorRow =
    seedAuthor ??
    (
      await db
        .select()
        .from(authors)
        .where(eq(authors.name, 'Redacción'))
        .limit(1)
    )[0];

  for (const user of SEED_USERS) {
    await db
      .insert(users)
      .values({
        ...user,
        passwordHash,
        authorId:
          user.role === 'author' || user.role === 'admin'
            ? (authorRow?.id ?? null)
            : null,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          role: user.role,
          passwordHash,
          authorId:
            user.role === 'author' || user.role === 'admin'
              ? (authorRow?.id ?? null)
              : null,
        },
      });
  }

  for (const category of SEED_CATEGORIES) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.slug });
  }

  for (const tag of SEED_TAGS) {
    await db
      .insert(tags)
      .values(tag)
      .onConflictDoNothing({ target: tags.slug });
  }

  await db
    .insert(siteSettings)
    .values(DEFAULT_SITE_SETTINGS)
    .onConflictDoNothing({ target: siteSettings.id });
}

if (require.main === module) {
  runSeed()
    .then(() => pool.end())
    .catch(async (error: unknown) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}
