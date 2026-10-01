import { ConflictException, NotFoundException } from '@nestjs/common';
import { db, pool } from '../database/database';
import { authors, categories, news, newsTags } from '../database/schema';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  const service = new TagsService();
  const uniqueSlug = () =>
    `tag-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  afterAll(async () => {
    await pool.end();
  });

  it('creates and lists tags', async () => {
    const slug = uniqueSlug();
    const created = await service.create({ name: 'Cultura', slug });
    expect(created.slug).toBe(slug);
    const all = await service.findAll();
    expect(all.some((t) => t.slug === slug)).toBe(true);
  });

  it('rejects duplicate slug with 409', async () => {
    const slug = uniqueSlug();
    await service.create({ name: 'Uno', slug });
    await expect(service.create({ name: 'Dos', slug })).rejects.toBeInstanceOf(
      ConflictException,
    );
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
    expect(result.items.some((tag) => tag.id === created.id)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('returns 404 when updating a missing tag', async () => {
    await expect(
      service.update('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a tag without news', async () => {
    const created = await service.create({
      name: 'Borrar',
      slug: uniqueSlug(),
    });
    await service.remove(created.id);
    const all = await service.findAll();
    expect(all.some((t) => t.id === created.id)).toBe(false);
  });

  it('blocks delete (409) when the tag has associated news', async () => {
    const tag = await service.create({
      name: 'ConNoticias',
      slug: uniqueSlug(),
    });
    const [category] = await db
      .insert(categories)
      .values({ name: `Cat-${Date.now()}`, slug: uniqueSlug() })
      .returning();
    const [author] = await db
      .insert(authors)
      .values({ name: `Autor-${Date.now()}` })
      .returning();
    const [newsRow] = await db
      .insert(news)
      .values({
        title: 'Noticia',
        slug: uniqueSlug(),
        summary: 'S',
        body: [{ type: 'paragraph', text: 'x' }],
        categoryId: category.id,
        authorId: author.id,
      })
      .returning();
    await db.insert(newsTags).values({ newsId: newsRow.id, tagId: tag.id });

    await expect(service.remove(tag.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
