import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../database/database';
import {
  authors,
  categories,
  media,
  news,
  readingHistory,
  savedNews,
} from '../database/schema';
import type { JwtPayload } from '../auth/guards/auth.guard';
import {
  ReadingHistoryQueryDto,
  SavedNewsQueryDto,
} from './dto/engagement.dto';

@Injectable()
export class EngagementService {
  async saveNews(newsId: string, user: JwtPayload) {
    await this.assertPublishedNews(newsId);

    await db
      .insert(savedNews)
      .values({ userId: user.sub, newsId })
      .onConflictDoNothing({
        target: [savedNews.userId, savedNews.newsId],
      });

    return { newsId, saved: true };
  }

  async removeSavedNews(newsId: string, user: JwtPayload): Promise<void> {
    await this.assertPublishedNews(newsId);
    await db
      .delete(savedNews)
      .where(and(eq(savedNews.userId, user.sub), eq(savedNews.newsId, newsId)));
  }

  async listSavedNews(user: JwtPayload, query: SavedNewsQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where = and(
      eq(savedNews.userId, user.sub),
      eq(news.status, 'published'),
    );

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(savedNews)
      .innerJoin(news, eq(savedNews.newsId, news.id))
      .where(where);

    const items = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        summary: news.summary,
        publishedAt: news.publishedAt,
        categoryId: news.categoryId,
        authorId: news.authorId,
        imageId: news.imageId,
        imageUrl: media.url,
        imageAlt: media.alt,
        savedAt: savedNews.createdAt,
      })
      .from(savedNews)
      .innerJoin(news, eq(savedNews.newsId, news.id))
      .innerJoin(authors, eq(news.authorId, authors.id))
      .innerJoin(categories, eq(news.categoryId, categories.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(where)
      .orderBy(desc(savedNews.createdAt), desc(news.id))
      .limit(size)
      .offset((page - 1) * size);

    return { items, page, size, total };
  }

  async recordReading(newsId: string, user: JwtPayload) {
    await this.assertPublishedNews(newsId);
    const lastReadAt = new Date();
    const [entry] = await db
      .insert(readingHistory)
      .values({ userId: user.sub, newsId, lastReadAt })
      .onConflictDoUpdate({
        target: [readingHistory.userId, readingHistory.newsId],
        set: { lastReadAt },
      })
      .returning({
        newsId: readingHistory.newsId,
        lastReadAt: readingHistory.lastReadAt,
      });

    return { newsId: entry.newsId, read: true, lastReadAt: entry.lastReadAt };
  }

  async listReadingHistory(user: JwtPayload, query: ReadingHistoryQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where = and(
      eq(readingHistory.userId, user.sub),
      eq(news.status, 'published'),
    );

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(readingHistory)
      .innerJoin(news, eq(readingHistory.newsId, news.id))
      .where(where);

    const items = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        summary: news.summary,
        publishedAt: news.publishedAt,
        categoryId: news.categoryId,
        authorId: news.authorId,
        imageId: news.imageId,
        imageUrl: media.url,
        imageAlt: media.alt,
        lastReadAt: readingHistory.lastReadAt,
      })
      .from(readingHistory)
      .innerJoin(news, eq(readingHistory.newsId, news.id))
      .innerJoin(authors, eq(news.authorId, authors.id))
      .innerJoin(categories, eq(news.categoryId, categories.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(where)
      .orderBy(desc(readingHistory.lastReadAt), desc(news.id))
      .limit(size)
      .offset((page - 1) * size);

    return { items, page, size, total };
  }

  async removeReadingHistoryEntry(
    newsId: string,
    user: JwtPayload,
  ): Promise<void> {
    await this.assertPublishedNews(newsId);
    await db
      .delete(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, user.sub),
          eq(readingHistory.newsId, newsId),
        ),
      );
  }

  async clearReadingHistory(user: JwtPayload): Promise<void> {
    await db.delete(readingHistory).where(eq(readingHistory.userId, user.sub));
  }

  private async assertPublishedNews(newsId: string): Promise<void> {
    const [publishedNews] = await db
      .select({ id: news.id })
      .from(news)
      .where(and(eq(news.id, newsId), eq(news.status, 'published')))
      .limit(1);

    if (!publishedNews) {
      throw new NotFoundException('News not found');
    }
  }
}
