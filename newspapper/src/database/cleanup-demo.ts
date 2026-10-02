import 'dotenv/config';
import { asc, desc, eq, inArray, ne, notInArray, sql } from 'drizzle-orm';
import { db, pool } from './database';
import {
  authors,
  categories,
  media,
  news,
  newsTags,
  tags,
  users,
} from './schema';

const RETAINED_USER_EMAIL = 'md@gmail.com';
const RETAINED_NEWS_LIMIT = 20;
const RETAINED_CATALOG_LIMIT = 20;

export interface CleanupSummary {
  retainedUserEmail: string;
  retainedNews: number;
  retainedCategories: number;
  retainedTags: number;
  deletedUsers: number;
  deletedNews: number;
  deletedCategories: number;
  deletedTags: number;
  deletedAuthors: number;
  deletedMedia: number;
}

export async function cleanupDemoData(): Promise<CleanupSummary> {
  return db.transaction(async (tx) => {
    const [retainedUser] = await tx
      .select({ id: users.id, authorId: users.authorId })
      .from(users)
      .where(eq(users.email, RETAINED_USER_EMAIL))
      .limit(1);

    if (!retainedUser) {
      throw new Error(`Required user not found: ${RETAINED_USER_EMAIL}`);
    }

    const retainedNewsRows = await tx
      .select({ id: news.id, categoryId: news.categoryId })
      .from(news)
      .where(eq(news.status, 'published'))
      .orderBy(sql`${news.publishedAt} desc nulls last`, desc(news.id))
      .limit(RETAINED_NEWS_LIMIT);

    if (retainedNewsRows.length === 0) {
      throw new Error('No published news found to retain');
    }

    const retainedNewsIds = retainedNewsRows.map((item) => item.id);
    const retainedCategoryIds = await selectCategoryIds(
      tx,
      retainedNewsRows.map((item) => item.categoryId),
    );
    const retainedTagRows = await tx
      .select({ tagId: newsTags.tagId })
      .from(newsTags)
      .where(inArray(newsTags.newsId, retainedNewsIds));
    const retainedTagIds = await selectTagIds(
      tx,
      retainedTagRows.map((item) => item.tagId),
    );

    const deletedNewsRows = await tx
      .delete(news)
      .where(notInArray(news.id, retainedNewsIds))
      .returning({ id: news.id });
    const deletedCategoryRows = await tx
      .delete(categories)
      .where(notInArray(categories.id, retainedCategoryIds))
      .returning({ id: categories.id });
    const deletedTagRows = await tx
      .delete(tags)
      .where(notInArray(tags.id, retainedTagIds))
      .returning({ id: tags.id });
    const deletedUserRows = await tx
      .delete(users)
      .where(ne(users.id, retainedUser.id))
      .returning({ id: users.id });

    const retainedAuthorIds = new Set<string>(
      retainedUser.authorId ? [retainedUser.authorId] : [],
    );
    const retainedNewsAuthors = await tx
      .select({ authorId: news.authorId })
      .from(news)
      .where(inArray(news.id, retainedNewsIds));
    for (const item of retainedNewsAuthors) {
      retainedAuthorIds.add(item.authorId);
    }

    const deletedAuthorRows = retainedAuthorIds.size
      ? await tx
          .delete(authors)
          .where(notInArray(authors.id, [...retainedAuthorIds]))
          .returning({ id: authors.id })
      : await tx.delete(authors).returning({ id: authors.id });
    const deletedMediaRows = await tx
      .delete(media)
      .where(
        sql`not exists (select 1 from ${news} where ${news.imageId} = ${media.id})`,
      )
      .returning({ id: media.id });

    return {
      retainedUserEmail: RETAINED_USER_EMAIL,
      retainedNews: retainedNewsIds.length,
      retainedCategories: retainedCategoryIds.length,
      retainedTags: retainedTagIds.length,
      deletedUsers: deletedUserRows.length,
      deletedNews: deletedNewsRows.length,
      deletedCategories: deletedCategoryRows.length,
      deletedTags: deletedTagRows.length,
      deletedAuthors: deletedAuthorRows.length,
      deletedMedia: deletedMediaRows.length,
    };
  });
}

async function selectCategoryIds(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  relatedIds: string[],
): Promise<string[]> {
  const related = [...new Set(relatedIds)];
  const relatedRows = related.length
    ? await tx
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.id, related))
    : [];
  const retainedIds = relatedRows.map((item) => item.id);
  const additionalRows = retainedIds.length
    ? await tx
        .select({ id: categories.id })
        .from(categories)
        .where(notInArray(categories.id, retainedIds))
        .orderBy(asc(categories.name), asc(categories.id))
        .limit(Math.max(0, RETAINED_CATALOG_LIMIT - retainedIds.length))
    : await tx
        .select({ id: categories.id })
        .from(categories)
        .orderBy(asc(categories.name), asc(categories.id))
        .limit(RETAINED_CATALOG_LIMIT);
  return [...retainedIds, ...additionalRows.map((item) => item.id)];
}

async function selectTagIds(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  relatedIds: string[],
): Promise<string[]> {
  const related = [...new Set(relatedIds)];
  const relatedRows = related.length
    ? await tx
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.id, related))
    : [];
  const retainedIds = relatedRows.map((item) => item.id);
  const additionalRows = retainedIds.length
    ? await tx
        .select({ id: tags.id })
        .from(tags)
        .where(notInArray(tags.id, retainedIds))
        .orderBy(asc(tags.name), asc(tags.id))
        .limit(Math.max(0, RETAINED_CATALOG_LIMIT - retainedIds.length))
    : await tx
        .select({ id: tags.id })
        .from(tags)
        .orderBy(asc(tags.name), asc(tags.id))
        .limit(RETAINED_CATALOG_LIMIT);
  return [...retainedIds, ...additionalRows.map((item) => item.id)];
}

if (require.main === module) {
  cleanupDemoData()
    .then((summary) => console.log(JSON.stringify(summary, null, 2)))
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
