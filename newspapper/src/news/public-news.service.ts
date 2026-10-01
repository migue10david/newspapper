import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../database/database';
import {
  authors,
  categories,
  media,
  news,
  newsTags,
  tags,
} from '../database/schema';
import { NewsSearchQueryDto } from './dto/news-search.dto';

@Injectable()
export class PublicNewsService {
  async listPublished(query: NewsSearchQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const conditions = [eq(news.status, 'published')];
    if (query.category) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, query.category))
        .limit(1);
      if (!category) {
        return { items: [], page, size, total: 0 };
      }
      conditions.push(eq(news.categoryId, category.id));
    }
    if (query.tag) {
      const [tag] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, query.tag.trim()))
        .limit(1);
      if (!tag) {
        return { items: [], page, size, total: 0 };
      }
      conditions.push(
        sql`${news.id} in (select ${newsTags.newsId} from ${newsTags} where ${newsTags.tagId} = ${tag.id})`,
      );
    }
    if (query.author) {
      conditions.push(eq(news.authorId, query.author));
    }
    if (query.q?.trim()) {
      const search = `%${query.q.trim()}%`;
      conditions.push(
        or(
          ilike(news.title, search),
          ilike(news.summary, search),
          ilike(authors.name, search),
        )!,
      );
    }
    if (query.from) {
      conditions.push(sql`${news.publishedAt} >= ${startOfUtcDay(query.from)}`);
    }
    if (query.to) {
      conditions.push(sql`${news.publishedAt} <= ${endOfUtcDay(query.to)}`);
    }
    const where = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(news)
      .innerJoin(authors, eq(news.authorId, authors.id))
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
      })
      .from(news)
      .innerJoin(authors, eq(news.authorId, authors.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(where)
      .orderBy(sql`${news.publishedAt} desc nulls last`, desc(news.id))
      .limit(size)
      .offset((page - 1) * size);

    return { items, page, size, total: count };
  }

  async findPublishedBySlug(slug: string) {
    const [row] = await db
      .select({
        news: news,
        category: categories,
        author: authors,
        imageUrl: media.url,
        imageAlt: media.alt,
      })
      .from(news)
      .innerJoin(categories, eq(news.categoryId, categories.id))
      .innerJoin(authors, eq(news.authorId, authors.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(and(eq(news.slug, slug), eq(news.status, 'published')))
      .limit(1);

    if (!row) {
      throw new NotFoundException('News not found');
    }

    const tagRows = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(newsTags)
      .innerJoin(tags, eq(newsTags.tagId, tags.id))
      .where(eq(newsTags.newsId, row.news.id));

    return {
      ...row.news,
      category: row.category,
      author: row.author,
      imageUrl: row.imageUrl,
      imageAlt: row.imageAlt,
      tags: tagRows,
    };
  }
}

function startOfUtcDay(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function endOfUtcDay(value: string): Date {
  return new Date(`${value.slice(0, 10)}T23:59:59.999Z`);
}
