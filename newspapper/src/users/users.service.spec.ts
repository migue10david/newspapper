import { ConflictException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { pool } from '../database/database';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const service = new UsersService();

  afterAll(async () => {
    await pool.end();
  });

  it('creates a user persisting a bcrypt hash, not plain text', async () => {
    const email = `admin-${Date.now()}@test.dev`;
    const user = await service.create({
      email,
      password: 'secret-password',
      role: 'admin',
    });

    expect(user.email).toBe(email);
    expect(user.role).toBe('admin');
    expect(user.passwordHash).not.toBe('secret-password');
    expect(user.passwordHash.length).toBeGreaterThan(20);
    expect(await compare('secret-password', user.passwordHash)).toBe(true);
  });

  it('rejects a duplicated email with ConflictException', async () => {
    const email = `dup-${Date.now()}@test.dev`;
    await service.create({ email, password: 'x-password', role: 'editor' });
    await expect(
      service.create({ email, password: 'x-password', role: 'editor' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists users', async () => {
    const email = `list-${Date.now()}@test.dev`;
    await service.create({ email, password: 'x-password', role: 'author' });
    const all = await service.findAll();
    expect(all.some((u) => u.email === email)).toBe(true);
  });
});
