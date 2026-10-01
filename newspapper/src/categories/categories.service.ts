import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { db } from '../database/database';
import { categories, news } from '../database/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ManageCategoriesQueryDto } from './dto/manage-categories-query.dto';

type CategoryRow = typeof categories.$inferSelect;

@Injectable()
export class CategoriesService {
  async create(dto: CreateCategoryDto): Promise<CategoryRow> {
    await this.assertSlugAvailable(dto.slug);
    const [created] = await db.insert(categories).values(dto).returning();
    return created;
  }

  async findAll(): Promise<CategoryRow[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async manage(query: ManageCategoriesQueryDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const search = query.search?.trim();
    const where = search
      ? or(
          ilike(categories.name, `%${search}%`),
          ilike(categories.slug, `%${search}%`),
        )
      : undefined;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(where);
    const items = await db
      .select()
      .from(categories)
      .where(where)
      .orderBy(asc(categories.name))
      .limit(size)
      .offset((page - 1) * size);
    return { items, page, size, total: count };
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryRow> {
    const [existing] = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }
    const [updated] = await db
      .update(categories)
      .set(dto)
      .where(eq(categories.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(news)
      .where(eq(news.categoryId, id));
    if (count > 0) {
      throw new ConflictException('Category has associated news');
    }
    await db.delete(categories).where(eq(categories.id, id));
  }

  private async assertSlugAvailable(
    slug: string,
    excludedId?: string,
  ): Promise<void> {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        excludedId
          ? and(eq(categories.slug, slug), ne(categories.id, excludedId))
          : eq(categories.slug, slug),
      )
      .limit(1);
    if (existing) {
      throw new ConflictException('Slug already in use');
    }
  }
}
