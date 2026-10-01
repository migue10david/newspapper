import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './app.module';
import { pool } from './database/database';

// Regression test: the app must boot with env vars loaded from .env
// (dotenv is loaded inside database.ts; specs must NOT import 'dotenv/config').
describe('App boot', () => {
  let app: INestApplication<App>;

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('boots AppModule and serves the public root', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await request(app.getHttpServer()).get('/').expect(200);
  });
});
