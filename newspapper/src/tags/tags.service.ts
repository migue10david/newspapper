import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { db } from '../database/database';
import { newsTags, tags } from '../database/schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ManageTagsQueryDto } from './dto/manage-tags-query.dto';

type TagRow = typeof tags.$inferSelect;

@Injectable()
export class TagsService {
  async create(dto: CreateTagDto): Promise<TagRow> {
    await this.assertSlugAvailable(dto.slug);
    const [created] = await db.insert(tags).values(dto).returning();
    return created;
  }

  async findAll(): Promise<TagRow[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async manage(query: ManageTagsQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const search = query.search?.trim();
    const where = search
      ? or(ilike(tags.name, `%${search}%`), ilike(tags.slug, `%${search}%`))
      : undefined;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tags)
      .where(where);
    const items = await db
      .select()
      .from(tags)
      .where(where)
      .orderBy(asc(tags.name))
      .limit(size)
      .offset((page - 1) * size);
    return { items, page, size, total: count };
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagRow> {
    const [existing] = await db
      .select({ id: tags.id, slug: tags.slug })
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }
    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }
    const [updated] = await db
      .update(tags)
      .set(dto)
      .where(eq(tags.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Tag not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsTags)
      .where(eq(newsTags.tagId, id));
    if (count > 0) {
      throw new ConflictException('Tag has associated news');
    }
    await db.delete(tags).where(eq(tags.id, id));
  }

  private async assertSlugAvailable(
    slug: string,
    excludedId?: string,
  ): Promise<void> {
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        excludedId
          ? and(eq(tags.slug, slug), ne(tags.id, excludedId))
          : eq(tags.slug, slug),
      )
      .limit(1);
    if (existing) {
      throw new ConflictException('Slug already in use');
    }
  }
}
