import { ConflictException, NotFoundException } from '@nestjs/common';
import { db, pool } from '../database/database';
import { authors, news } from '../database/schema';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const service = new CategoriesService();
  const uniqueSlug = () =>
    `cat-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  afterAll(async () => {
    await pool.end();
  });

  it('creates and lists categories', async () => {
    const slug = uniqueSlug();
    const created = await service.create({ name: 'Política', slug });
    expect(created.slug).toBe(slug);
    const all = await service.findAll();
    expect(all.some((c) => c.slug === slug)).toBe(true);
  });

  it('rejects duplicate slug with 409', async () => {
    const slug = uniqueSlug();
    await service.create({ name: 'Uno', slug });
    await expect(service.create({ name: 'Dos', slug })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates a category', async () => {
    const created = await service.create({
      name: 'Previo',
      slug: uniqueSlug(),
    });
    const updated = await service.update(created.id, { name: 'Actualizado' });
    expect(updated.name).toBe('Actualizado');
  });

  it('allows keeping its own slug and supports paginated search', async () => {
    const slug = uniqueSlug();
    const created = await service.create({ name: 'Buscable', slug });
    await expect(service.update(created.id, { slug })).resolves.toMatchObject({
      id: created.id,
      slug,
    });
    const result = await service.manage({
      page: 1,
      size: 10,
      search: 'Buscable',
    });
    expect(result.items.some((category) => category.id === created.id)).toBe(
      true,
    );
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
  });

  it('returns 404 when updating a missing category', async () => {
    await expect(
      service.update('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a category without news', async () => {
    const created = await service.create({
      name: 'Borrar',
      slug: uniqueSlug(),
    });
    await service.remove(created.id);
    const all = await service.findAll();
    expect(all.some((c) => c.id === created.id)).toBe(false);
  });

  it('blocks delete (409) when the category has associated news', async () => {
    const category = await service.create({
      name: 'ConNoticias',
      slug: uniqueSlug(),
    });
    // insert minimal author + news linked to the category
    const [author] = await db
      .insert(authors)
      .values({ name: `Autor-${Date.now()}` })
      .returning();
    await db.insert(news).values({
      title: 'Noticia',
      slug: uniqueSlug(),
      summary: 'S',
      body: [{ type: 'paragraph', text: 'x' }],
      categoryId: category.id,
      authorId: author.id,
    });

    await expect(service.remove(category.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
