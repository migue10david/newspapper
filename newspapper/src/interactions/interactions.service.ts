import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../database/database';
import {
  authors,
  comments,
  news,
  newsReactions,
  users,
} from '../database/schema';
import type { JwtPayload } from '../auth/guards/auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ManageCommentsQueryDto } from './dto/manage-comments-query.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { ReactionDto } from './dto/reaction.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class InteractionsService {
  async createComment(newsId: string, dto: CreateCommentDto, user: JwtPayload) {
    await this.assertPublishedNews(newsId);
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Comment body cannot be empty');
    }

    const [created] = await db
      .insert(comments)
      .values({ newsId, userId: user.sub, body })
      .returning();
    return this.toOwnerComment(created);
  }

  async updateComment(id: string, dto: UpdateCommentDto, user: JwtPayload) {
    const existing = await this.findComment(id);
    this.assertCommentOwner(existing, user);
    if (existing.deletedAt) {
      throw new NotFoundException('Comment not found');
    }
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Comment body cannot be empty');
    }

    const [updated] = await db
      .update(comments)
      .set({
        body,
        status: 'pending',
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(comments.id, id),
          eq(comments.userId, user.sub),
          eq(comments.version, dto.version),
          isNull(comments.deletedAt),
        ),
      )
      .returning();
    if (!updated) {
      throw new ConflictException('Comment version mismatch');
    }
    return this.toOwnerComment(updated);
  }

  async removeComment(id: string, user: JwtPayload): Promise<void> {
    const existing = await this.findComment(id);
    this.assertCommentOwner(existing, user);
    if (existing.deletedAt) {
      return;
    }
    await db
      .update(comments)
      .set({
        status: 'hidden',
        deletedAt: new Date(),
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)));
  }

  async setReaction(newsId: string, dto: ReactionDto, user: JwtPayload) {
    await this.assertPublishedNews(newsId);
    const [reaction] = await db
      .insert(newsReactions)
      .values({ newsId, userId: user.sub, type: dto.type })
      .onConflictDoUpdate({
        target: [newsReactions.newsId, newsReactions.userId],
        set: { type: dto.type, updatedAt: new Date() },
      })
      .returning();
    return reaction;
  }

  async removeReaction(newsId: string, user: JwtPayload): Promise<void> {
    await this.assertPublishedNews(newsId);
    await db
      .delete(newsReactions)
      .where(
        and(
          eq(newsReactions.newsId, newsId),
          eq(newsReactions.userId, user.sub),
        ),
      );
  }

  async getPublicInteractions(slug: string) {
    const [publishedNews] = await db
      .select({ id: news.id })
      .from(news)
      .where(and(eq(news.slug, slug), eq(news.status, 'published')))
      .limit(1);
    if (!publishedNews) {
      throw new NotFoundException('News not found');
    }

    const publicComments = await db
      .select({
        id: comments.id,
        body: comments.body,
        version: comments.version,
        authorId: users.id,
        authorName: sql<string>`coalesce(${authors.name}, 'Usuario')`,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .leftJoin(authors, eq(users.authorId, authors.id))
      .where(
        and(
          eq(comments.newsId, publishedNews.id),
          eq(comments.status, 'published'),
          isNull(comments.deletedAt),
        ),
      )
      .orderBy(asc(comments.createdAt), asc(comments.id));

    const reactionRows = await db
      .select({ type: newsReactions.type, total: count(newsReactions.userId) })
      .from(newsReactions)
      .where(eq(newsReactions.newsId, publishedNews.id))
      .groupBy(newsReactions.type);
    const reactions = { like: 0, useful: 0 };
    for (const row of reactionRows) {
      reactions[row.type] = Number(row.total);
    }

    return {
      comments: publicComments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        version: comment.version,
        author: { id: comment.authorId, displayName: comment.authorName },
        createdAt: comment.createdAt,
      })),
      reactions,
      totalComments: publicComments.length,
    };
  }

  async listForModeration(query: ManageCommentsQueryDto) {
    const page = query.page;
    const size = query.size;
    const conditions = [sql`true`];
    if (query.status) conditions.push(eq(comments.status, query.status));
    if (query.newsId) conditions.push(eq(comments.newsId, query.newsId));

    const where = and(...conditions);
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(comments)
      .where(where);
    const items = await db
      .select({
        id: comments.id,
        body: comments.body,
        status: comments.status,
        version: comments.version,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        deletedAt: comments.deletedAt,
        newsId: news.id,
        newsTitle: news.title,
        authorId: users.id,
        authorName: sql<string>`coalesce(${authors.name}, 'Usuario')`,
      })
      .from(comments)
      .innerJoin(news, eq(comments.newsId, news.id))
      .innerJoin(users, eq(comments.userId, users.id))
      .leftJoin(authors, eq(users.authorId, authors.id))
      .where(where)
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(size)
      .offset((page - 1) * size);

    return { items, page, size, total };
  }

  async moderateComment(id: string, dto: ModerateCommentDto) {
    const existing = await this.findComment(id);
    if (existing.deletedAt) {
      throw new NotFoundException('Comment not found');
    }
    const [updated] = await db
      .update(comments)
      .set({
        status: dto.status,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(comments.id, id),
          eq(comments.version, dto.version),
          isNull(comments.deletedAt),
        ),
      )
      .returning();
    if (!updated) {
      throw new ConflictException('Comment version mismatch');
    }
    return updated;
  }

  private async assertPublishedNews(newsId: string): Promise<void> {
    const [publishedNews] = await db
      .select({ id: news.id })
      .from(news)
      .where(and(eq(news.id, newsId), eq(news.status, 'published')))
      .limit(1);
    if (!publishedNews) {
      throw new NotFoundException('Published news not found');
    }
  }

  private async findComment(id: string) {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private assertCommentOwner(
    comment: typeof comments.$inferSelect,
    user: JwtPayload,
  ): void {
    if (comment.userId !== user.sub) {
      throw new ForbiddenException('You can only manage your own comments');
    }
  }

  private toOwnerComment(comment: typeof comments.$inferSelect) {
    return {
      id: comment.id,
      newsId: comment.newsId,
      userId: comment.userId,
      body: comment.body,
      status: comment.status,
      version: comment.version,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
