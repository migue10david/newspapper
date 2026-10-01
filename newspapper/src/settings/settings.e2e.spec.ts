import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { pool } from '../database/database';

describe('Taxonomy and settings management (e2e)', () => {
  let app: INestApplication<App>;
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });
  const tokenFor = (role: 'author' | 'editor' | 'admin') =>
    `Bearer ${jwt.sign({ sub: '00000000-0000-0000-0000-000000000001', email: `${role}@test.dev`, role })}`;
  const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('protects administrative catalog listing by role', async () => {
    await request(app.getHttpServer()).get('/categories/manage').expect(401);
    await request(app.getHttpServer())
      .get('/categories/manage')
      .set('Authorization', tokenFor('author'))
      .expect(403);
    const response = await request(app.getHttpServer())
      .get('/categories/manage?page=1&size=10&search=general')
      .set('Authorization', tokenFor('editor'))
      .expect(200);
    const listing = response.body as unknown as {
      items: unknown[];
      page: number;
      size: number;
    };
    expect(response.body).toEqual(
      expect.objectContaining({ page: 1, size: 10 }),
    );
    expect(Array.isArray(listing.items)).toBe(true);
  });

  it('supports category and tag CRUD conflicts', async () => {
    const suffix = unique();
    const category = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', tokenFor('editor'))
      .send({ name: `Categoria ${suffix}`, slug: `categoria-${suffix}` })
      .expect(201);
    const categoryBody = category.body as unknown as {
      id: string;
      slug: string;
    };
    await request(app.getHttpServer())
      .patch(`/categories/${categoryBody.id}`)
      .set('Authorization', tokenFor('editor'))
      .send({ slug: categoryBody.slug })
      .expect(200);
    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', tokenFor('editor'))
      .send({ name: 'Duplicada', slug: categoryBody.slug })
      .expect(409);
    await request(app.getHttpServer())
      .post('/tags')
      .set('Authorization', tokenFor('editor'))
      .send({ name: `Tag ${suffix}`, slug: `tag-${suffix}` })
      .expect(201);
    await request(app.getHttpServer())
      .delete('/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', tokenFor('editor'))
      .expect(404);
  });

  it('keeps public settings readable and admin-only for updates', async () => {
    const publicResponse = await request(app.getHttpServer())
      .get('/public/settings')
      .expect(200);
    const publicSettings = publicResponse.body as unknown as {
      siteName: string;
      description: string;
    };
    expect(publicResponse.body).toEqual(
      expect.objectContaining({
        siteName: publicSettings.siteName,
        description: publicSettings.description,
      }),
    );
    await request(app.getHttpServer())
      .patch('/settings')
      .set('Authorization', tokenFor('editor'))
      .send({ siteName: 'No permitido', description: 'No permitido' })
      .expect(403);
    const updated = await request(app.getHttpServer())
      .patch('/settings')
      .set('Authorization', tokenFor('admin'))
      .send({
        siteName: 'Diario Central',
        description: 'Noticias de la redacción',
        logoUrl: null,
      })
      .expect(200);
    const updatedSettings = updated.body as unknown as { siteName: string };
    expect(updatedSettings.siteName).toBe('Diario Central');
    expect(updated.body).not.toHaveProperty('id');
    await request(app.getHttpServer())
      .get('/public/settings')
      .expect(200)
      .expect((response) => {
        const settings = response.body as unknown as { siteName: string };
        expect(settings.siteName).toBe('Diario Central');
      });
  });
});
