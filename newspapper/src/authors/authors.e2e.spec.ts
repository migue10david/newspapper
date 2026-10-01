import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { pool } from '../database/database';

describe('Authors permissions (e2e)', () => {
  let app: INestApplication<App>;
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });
  const tokenFor = (role: 'author' | 'editor' | 'admin') =>
    `Bearer ${jwt.sign({ sub: '00000000-0000-0000-0000-000000000001', role })}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('returns 403 for editors on POST /authors', () => {
    return request(app.getHttpServer())
      .post('/authors')
      .set('Authorization', tokenFor('editor'))
      .send({ name: 'X' })
      .expect(403);
  });

  it('returns 200 for admins on GET /authors', () => {
    return request(app.getHttpServer())
      .get('/authors')
      .set('Authorization', tokenFor('admin'))
      .expect(200);
  });

  it('returns 401 without token', () => {
    return request(app.getHttpServer()).get('/authors').expect(401);
  });
});
