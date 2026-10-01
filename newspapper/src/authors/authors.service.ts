import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../database/database';
import { authors } from '../database/schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

type AuthorRow = typeof authors.$inferSelect;

@Injectable()
export class AuthorsService {
  async create(dto: CreateAuthorDto): Promise<AuthorRow> {
    await this.assertNameAvailable(dto.name);
    const [created] = await db.insert(authors).values(dto).returning();
    return created;
  }

  async findAll(): Promise<AuthorRow[]> {
    return db.select().from(authors).orderBy(authors.name);
  }

  async update(id: string, dto: UpdateAuthorDto): Promise<AuthorRow> {
    if (dto.name) {
      await this.assertNameAvailable(dto.name);
    }
    const [updated] = await db
      .update(authors)
      .set(dto)
      .where(eq(authors.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Author not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await db
      .delete(authors)
      .where(eq(authors.id, id))
      .returning({ id: authors.id });
    if (deleted.length === 0) {
      throw new NotFoundException('Author not found');
    }
  }

  private async assertNameAvailable(name: string): Promise<void> {
    const [existing] = await db
      .select({ id: authors.id })
      .from(authors)
      .where(eq(authors.name, name))
      .limit(1);
    if (existing) {
      throw new ConflictException('Author name already in use');
    }
  }
}
