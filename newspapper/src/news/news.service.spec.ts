import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, pool } from '../database/database';
import { authors, categories, news, users } from '../database/schema';
import { UsersService } from '../users/users.service';
import { NewsService } from './news.service';
import { SlugService } from './slug.service';
import { StateMachine } from './state-machine';

describe('NewsService', () => {
  const usersService = new UsersService();
  const service = new NewsService(
    new SlugService(),
    new StateMachine(),
    usersService,
  );
  const stamp = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  let categoryId: string;
  let authorId: string;
  let authorUserId: string;
  let adminUser: { sub: string; role: 'admin' };

  const baseDto = () => ({
    title: `Título ${stamp()}`,
    summary: 'Resumen',
    body: [{ type: 'paragraph' as const, text: 'Contenido' }],
    categoryId,
    authorId,
    tagIds: [] as string[],
  });
  beforeAll(async () => {
    const [cat] = await db
      .insert(categories)
      .values({ name: `Cat-${stamp()}`, slug: `cat-${stamp()}` })
      .returning();
    categoryId = cat.id;
    const [author] = await db
      .insert(authors)
      .values({ name: `Autor-${stamp()}` })
      .returning();
    authorId = author.id;
    const authorUser = await usersService.create({
      email: `news-author-${stamp()}@test.dev`,
      password: 'author-password',
      role: 'author',
    });
    await db.update(users).set({ authorId }).where(eq(users.id, authorUser.id));
    authorUserId = authorUser.id;
    const admin = await usersService.create({
      email: `news-admin-${stamp()}@test.dev`,
      password: 'admin-password',
      role: 'admin',
    });
    await db.update(users).set({ authorId }).where(eq(users.id, admin.id));
    adminUser = { sub: admin.id, role: 'admin' };
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates a draft deriving a kebab-case slug from the title', async () => {
    const created = await service.create(baseDto(), adminUser);
    expect(created.status).toBe('draft');
    expect(created.slug).toMatch(/^titulo-\d+-\d+$/);
    expect(created.version).toBe(1);
  });

  it('rejects a duplicated slug', async () => {
    const dto = baseDto();
    await service.create(dto, adminUser);
    await expect(service.create(dto, adminUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates with the correct version and bumps version', async () => {
    const created = await service.create(baseDto(), adminUser);
    const updated = await service.update(
      created.id,
      {
        summary: 'Nuevo resumen',
        version: 1,
      },
      adminUser,
    );
    expect(updated.summary).toBe('Nuevo resumen');
    expect(updated.version).toBe(2);
  });

  it('rejects update with a stale version (409)', async () => {
    const created = await service.create(baseDto(), adminUser);
    await service.update(created.id, { summary: 'A', version: 1 }, adminUser);
    await expect(
      service.update(created.id, { summary: 'B', version: 1 }, adminUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects update of a missing news (404)', async () => {
    await expect(
      service.update(
        '00000000-0000-0000-0000-000000000000',
        {
          summary: 'X',
          version: 1,
        },
        adminUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects slug change once published unless admin (RF-032)', async () => {
    const created = await service.create(baseDto(), adminUser);
    await db
      .update(news)
      .set({ status: 'published' })
      .where(eq(news.id, created.id));
    const newSlug = `otro-slug-${stamp()}`;
    await expect(
      service.update(
        created.id,
        { slug: newSlug, version: 1 },
        { sub: authorUserId, role: 'author' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const updated = await service.update(
      created.id,
      { slug: newSlug, version: 1 },
      adminUser,
    );
    expect(updated.slug).toBe(newSlug);
  });
});
