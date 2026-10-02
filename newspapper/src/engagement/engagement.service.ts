import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../database/database';
import {
  authors,
  categories,
  media,
  news,
  savedNews,
} from '../database/schema';
import type { JwtPayload } from '../auth/guards/auth.guard';
import { SavedNewsQueryDto } from './dto/engagement.dto';

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
