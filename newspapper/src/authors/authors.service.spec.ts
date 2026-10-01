import { ConflictException, NotFoundException } from '@nestjs/common';
import { pool } from '../database/database';
import { AuthorsService } from './authors.service';

describe('AuthorsService', () => {
  const service = new AuthorsService();
  const uniqueName = () =>
    `Autor ${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  afterAll(async () => {
    await pool.end();
  });

  it('creates and lists authors', async () => {
    const name = uniqueName();
    const created = await service.create({ name, bio: 'Bio' });
    expect(created.name).toBe(name);
    const all = await service.findAll();
    expect(all.some((a) => a.id === created.id)).toBe(true);
  });

  it('rejects duplicate name with 409', async () => {
    const name = uniqueName();
    await service.create({ name });
    await expect(service.create({ name })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates an author and returns 404 when missing', async () => {
    const created = await service.create({ name: uniqueName() });
    const updated = await service.update(created.id, { bio: 'Nueva bio' });
    expect(updated.bio).toBe('Nueva bio');
    await expect(
      service.update('00000000-0000-0000-0000-000000000000', { bio: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an author and returns 404 when missing', async () => {
    const created = await service.create({ name: uniqueName() });
    await service.remove(created.id);
    await expect(service.remove(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
