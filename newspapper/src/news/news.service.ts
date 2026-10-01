import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../database/database';
import {
  authors,
  categories,
  media,
  news,
  newsTags,
  tags,
  users,
} from '../database/schema';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/dto/create-user.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { TransitionDto } from './dto/transition.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { ManageNewsQueryDto } from './dto/news-search.dto';
import { SlugService } from './slug.service';
import { StateMachine } from './state-machine';
import { sanitizeRichTextBlocks } from './rich-text-sanitizer';

type NewsRow = typeof news.$inferSelect;
type NewsUser = { sub: string; role: UserRole };

export interface ManagedNews {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: unknown;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  status: NewsRow['status'];
  publishedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NewsService {
  constructor(
    private readonly slugService: SlugService,
    private readonly stateMachine: StateMachine,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateNewsDto, user: NewsUser): Promise<NewsRow> {
    const currentUser = await this.usersService.ensureAuthorProfile(user.sub);
    if (!currentUser?.authorId) {
      throw new ForbiddenException('Author profile is not linked');
    }
    const authorId = currentUser.authorId;
    const [author] = await db
      .select({ id: authors.id })
      .from(authors)
      .where(eq(authors.id, authorId))
      .limit(1);
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    const baseSlug = dto.slug ?? this.slugService.normalize(dto.title);
    await this.slugService.assertAvailable(baseSlug, (s) => this.slugExists(s));
    const slug = baseSlug;
    const { tagIds, publishedAt, ...rest } = dto;
    await this.assertMediaExists(dto.imageId);
    const [created] = await db
      .insert(news)
      .values({
        ...rest,
        body: sanitizeRichTextBlocks(rest.body),
        authorId,
        slug,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        status: 'draft',
      })
      .returning();
    if (tagIds?.length) {
      await db
        .insert(newsTags)
        .values(tagIds.map((tagId) => ({ newsId: created.id, tagId })));
    }
    return created;
  }

  async update(
    id: string,
    dto: UpdateNewsDto,
    user: NewsUser,
  ): Promise<NewsRow> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('News not found');
    }
    await this.assertEditPermission(existing, user);
    if (
      user.role === 'author' &&
      existing.status !== 'draft' &&
      existing.status !== 'inReview'
    ) {
      throw new ForbiddenException(
        'Authors can only edit drafts or news in review',
      );
    }
    if (
      dto.slug &&
      dto.slug !== existing.slug &&
      existing.status !== 'draft' &&
      user.role !== 'admin'
    ) {
      throw new ConflictException(
        'Slug cannot change after leaving draft unless admin',
      );
    }
    if (dto.slug && dto.slug !== existing.slug) {
      await this.slugService.assertAvailable(dto.slug, (slug) =>
        this.slugExists(slug),
      );
    }
    const { tagIds, publishedAt, version, authorId, body, imageId, ...rest } =
      dto;
    await this.assertMediaExists(imageId);
    const updated = await db
      .update(news)
      .set({
        ...rest,
        ...(body ? { body: sanitizeRichTextBlocks(body) } : {}),
        ...(imageId !== undefined ? { imageId: imageId ?? null } : {}),
        ...(user.role === 'admin' && authorId ? { authorId } : {}),
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(news.id, id), eq(news.version, version)))
      .returning();
    if (updated.length === 0) {
      throw new ConflictException('Version mismatch');
    }
    if (tagIds) {
      await db.delete(newsTags).where(eq(newsTags.newsId, id));
      if (tagIds.length) {
        await db
          .insert(newsTags)
          .values(tagIds.map((tagId) => ({ newsId: id, tagId })));
      }
    }
    return updated[0];
  }

  async findById(id: string): Promise<NewsRow | undefined> {
    const [row] = await db.select().from(news).where(eq(news.id, id)).limit(1);
    return row;
  }

  async findAll(user: NewsUser, query: NewsQueryDto): Promise<ManagedNews[]> {
    const conditions = query.status ? [eq(news.status, query.status)] : [];
    if (user.role === 'author') {
      const currentUser = await this.getUser(user.sub);
      if (!currentUser?.authorId) {
        throw new ForbiddenException('Author profile is not linked');
      }
      conditions.push(eq(news.authorId, currentUser.authorId));
    }
    const rows = await db
      .select({
        news,
        categoryName: categories.name,
        authorName: authors.name,
        imageUrl: media.url,
        imageAlt: media.alt,
      })
      .from(news)
      .innerJoin(categories, eq(news.categoryId, categories.id))
      .innerJoin(authors, eq(news.authorId, authors.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(news.updatedAt));
    return rows.map(
      ({ news: item, categoryName, authorName, imageUrl, imageAlt }) => ({
        ...item,
        categoryName,
        authorName,
        imageUrl,
        imageAlt,
      }),
    );
  }

  async findManage(user: NewsUser, query: ManageNewsQueryDto) {
    const conditions: SQL[] = [];
    if (query.status) {
      conditions.push(eq(news.status, query.status));
    }
    if (user.role === 'author') {
      const currentUser = await this.getUser(user.sub);
      if (!currentUser?.authorId) {
        throw new ForbiddenException('Author profile is not linked');
      }
      conditions.push(eq(news.authorId, currentUser.authorId));
    } else if (query.author) {
      conditions.push(eq(news.authorId, query.author));
    }
    if (query.category?.trim()) {
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, query.category.trim()))
        .limit(1);
      if (!category) return emptyPage(query);
      conditions.push(eq(news.categoryId, category.id));
    }
    if (query.tag?.trim()) {
      const [tag] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, query.tag.trim()))
        .limit(1);
      if (!tag) return emptyPage(query);
      const matchingNews = db
        .select({ newsId: newsTags.newsId })
        .from(newsTags)
        .where(eq(newsTags.tagId, tag.id));
      conditions.push(inArray(news.id, matchingNews));
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

    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where = conditions.length ? and(...conditions) : undefined;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(news)
      .innerJoin(authors, eq(news.authorId, authors.id))
      .where(where);
    const rows = await db
      .select({
        news,
        categoryName: categories.name,
        authorName: authors.name,
        imageUrl: media.url,
        imageAlt: media.alt,
      })
      .from(news)
      .innerJoin(categories, eq(news.categoryId, categories.id))
      .innerJoin(authors, eq(news.authorId, authors.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(where)
      .orderBy(desc(news.updatedAt), desc(news.id))
      .limit(size)
      .offset((page - 1) * size);

    return {
      items: rows.map(
        ({ news: item, categoryName, authorName, imageUrl, imageAlt }) => ({
          ...item,
          categoryName,
          authorName,
          imageUrl,
          imageAlt,
        }),
      ),
      page,
      size,
      total: count,
    };
  }

  async findOne(id: string, user: NewsUser): Promise<ManagedNews> {
    const rows = await db
      .select({
        news,
        categoryName: categories.name,
        authorName: authors.name,
        imageUrl: media.url,
        imageAlt: media.alt,
      })
      .from(news)
      .innerJoin(categories, eq(news.categoryId, categories.id))
      .innerJoin(authors, eq(news.authorId, authors.id))
      .leftJoin(media, eq(news.imageId, media.id))
      .where(eq(news.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('News not found');
    }
    await this.assertEditPermission(row.news, user);
    return {
      ...row.news,
      categoryName: row.categoryName,
      authorName: row.authorName,
      imageUrl: row.imageUrl,
      imageAlt: row.imageAlt,
    };
  }

  async transition(
    id: string,
    dto: TransitionDto,
    user: NewsUser,
  ): Promise<NewsRow> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('News not found');
    }
    await this.assertEditPermission(existing, user);

    if (user.role === 'author' && dto.target !== 'inReview') {
      throw new ForbiddenException('Authors can only submit for review');
    }
    this.stateMachine.assertTransition(existing.status, dto.target);

    const publishedAt =
      dto.target === 'published'
        ? (existing.publishedAt ?? new Date())
        : undefined;
    const [updated] = await db
      .update(news)
      .set({
        status: dto.target,
        publishedAt,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(news.id, id), eq(news.version, dto.version)))
      .returning();
    if (!updated) {
      throw new ConflictException('Version mismatch');
    }
    return updated;
  }

  async remove(id: string, user: NewsUser): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('News not found');
    }
    if (existing.status !== 'draft') {
      throw new ConflictException('Only drafts can be deleted');
    }
    await this.assertEditPermission(existing, user);
    await db.delete(news).where(eq(news.id, id));
  }

  private async assertEditPermission(
    row: NewsRow,
    user: NewsUser,
  ): Promise<void> {
    if (user.role === 'editor' || user.role === 'admin') {
      return;
    }
    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);
    if (!userRow?.authorId || userRow.authorId !== row.authorId) {
      throw new ForbiddenException('Not your news');
    }
  }

  private async slugExists(slug: string): Promise<boolean> {
    const [row] = await db
      .select({ id: news.id })
      .from(news)
      .where(eq(news.slug, slug))
      .limit(1);
    return !!row;
  }

  private async assertMediaExists(
    imageId: string | null | undefined,
  ): Promise<void> {
    if (!imageId) return;
    const [asset] = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.id, imageId))
      .limit(1);
    if (!asset) throw new NotFoundException('Media not found');
  }

  private async getUser(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }
}

function emptyPage(query: ManageNewsQueryDto) {
  return {
    items: [],
    page: query.page ?? 1,
    size: query.size ?? 20,
    total: 0,
  };
}

function startOfUtcDay(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function endOfUtcDay(value: string): Date {
  return new Date(`${value.slice(0, 10)}T23:59:59.999Z`);
}
