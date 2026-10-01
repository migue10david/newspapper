import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../database/database';
import { authors, users } from '../database/schema';
import { CreateUserDto, type UserRole } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

type UserRow = typeof users.$inferSelect;

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  authorId: string | null;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    authorId: user.authorId,
  };
}

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto): Promise<UserRow> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await hash(dto.password, 10);
    const [created] = await db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        role: dto.role,
      })
      .returning();
    return created;
  }

  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row;
  }

  async findById(id: string): Promise<UserRow | undefined> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row;
  }

  async findAll(): Promise<UserRow[]> {
    return db.select().from(users).orderBy(users.email);
  }

  async ensureAuthorProfile(id: string): Promise<UserRow | undefined> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!user || (user.role !== 'author' && user.role !== 'admin')) {
        return user;
      }
      if (user.authorId) {
        return user;
      }

      const [existingAuthor] = await tx
        .select()
        .from(authors)
        .where(eq(authors.name, user.email))
        .limit(1);
      const author =
        existingAuthor ??
        (await tx.insert(authors).values({ name: user.email }).returning())[0];
      if (!author) {
        return user;
      }

      const [updated] = await tx
        .update(users)
        .set({ authorId: author.id })
        .where(eq(users.id, id))
        .returning();
      return updated;
    });
  }

  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    currentUserId: string,
  ): Promise<UserRow> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.id === currentUserId) {
        throw new ForbiddenException('You cannot change your own role');
      }

      if (user.role === 'admin' && dto.role !== 'admin') {
        const administrators = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'admin'));

        if (administrators.length <= 1) {
          throw new ForbiddenException(
            'The system must keep at least one administrator',
          );
        }
      }

      const [updated] = await tx
        .update(users)
        .set({ role: dto.role })
        .where(eq(users.id, id))
        .returning();

      return updated;
    });
  }

  async updateAuthor(id: string, authorId: string | null): Promise<UserRow> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'author' && authorId !== null) {
      throw new BadRequestException(
        'Only author users can have an author profile',
      );
    }
    if (authorId) {
      const [author] = await db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.id, authorId))
        .limit(1);
      if (!author) {
        throw new NotFoundException('Author profile not found');
      }
    }
    const [updated] = await db
      .update(users)
      .set({ authorId })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}
