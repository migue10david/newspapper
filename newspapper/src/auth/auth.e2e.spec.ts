import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { db, pool } from '../database/database';
import { authors, refreshTokens, users } from '../database/schema';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';

describe('Auth guard + Roles (e2e)', () => {
  let app: INestApplication<App>;
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });

  const tokenFor = (role: 'author' | 'editor' | 'admin') =>
    `Bearer ${jwt.sign({ sub: '00000000-0000-0000-0000-000000000001', role })}`;
  const usersService = new UsersService();
  const loginEmail = `refresh-${Date.now()}@test.dev`;
  const loginPassword = 'refresh-password';
  let loginUserId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.enableCors({ origin: 'http://localhost:3000', credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    const user = await usersService.create({
      email: loginEmail,
      password: loginPassword,
      role: 'editor',
    });
    loginUserId = user.id;
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('returns 401 without token on protected endpoints', () => {
    return request(app.getHttpServer()).get('/users').expect(401);
  });

  it('returns 401 with an invalid token', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('returns 403 when role is insufficient', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', tokenFor('author'))
      .expect(403);
  });

  it('returns 200 with the required role', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', tokenFor('admin'))
      .expect(200);
  });

  it('keeps /auth/login public', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@periodico.dev', password: 'wrong' })
      .expect(401); // credenciales inválidas, NO 401 de guard: la ruta debe llegar al servicio
  });

  it('registers a public author without creating a session', async () => {
    const email = `register-${Date.now()}@test.dev`;
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'register-password' })
      .expect(201);

    const responseBody = response.body as {
      id?: unknown;
      email?: unknown;
      role?: unknown;
    };
    expect(typeof responseBody.id).toBe('string');
    expect(responseBody.email).toBe(email);
    expect(responseBody.role).toBe('author');
    expect(response.headers['set-cookie']).toBeUndefined();

    const [user] = await db.select().from(users).where(eq(users.email, email));
    expect(user.role).toBe('author');
    expect(user.passwordHash).not.toBe('register-password');

    const sessions = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, user.id));
    expect(sessions).toHaveLength(0);
  });

  it('rejects invalid and duplicated public registrations', async () => {
    const email = `duplicate-register-${Date.now()}@test.dev`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'short' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'register-password' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'register-password' })
      .expect(409);
  });

  it('keeps GET / public', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });

  it('allows admins to list, create and update users without exposing password hashes', async () => {
    const adminEmail = `role-admin-${Date.now()}@test.dev`;
    const targetEmail = `role-target-${Date.now()}@test.dev`;
    const admin = await usersService.create({
      email: adminEmail,
      password: 'admin-password',
      role: 'admin',
    });
    const target = await usersService.create({
      email: targetEmail,
      password: 'target-password',
      role: 'author',
    });
    const authorization = `Bearer ${jwt.sign({
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    })}`;

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', authorization)
      .expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: target.id,
          email: targetEmail,
          role: 'author',
        }),
      ]),
    );
    const listedUsers = listResponse.body as unknown[];
    expect(
      listedUsers.every(
        (user: unknown) =>
          typeof user === 'object' &&
          user !== null &&
          !('passwordHash' in user),
      ),
    ).toBe(true);

    const createdResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', authorization)
      .send({
        email: `role-created-${Date.now()}@test.dev`,
        password: 'created-password',
        role: 'editor',
      })
      .expect(201);
    expect(createdResponse.body).toMatchObject({ role: 'editor' });
    expect(createdResponse.body).not.toHaveProperty('passwordHash');

    const [authorProfile] = await db
      .insert(authors)
      .values({ name: `Linked author ${Date.now()}` })
      .returning();
    const linkedResponse = await request(app.getHttpServer())
      .patch(`/users/${target.id}/author`)
      .set('Authorization', authorization)
      .send({ authorId: authorProfile.id })
      .expect(200);
    expect((linkedResponse.body as { authorId: string | null }).authorId).toBe(
      authorProfile.id,
    );
    const unlinkedResponse = await request(app.getHttpServer())
      .patch(`/users/${target.id}/author`)
      .set('Authorization', authorization)
      .send({ authorId: null })
      .expect(200);
    expect(
      (unlinkedResponse.body as { authorId: string | null }).authorId,
    ).toBeNull();

    const updateResponse = await request(app.getHttpServer())
      .patch(`/users/${target.id}/role`)
      .set('Authorization', authorization)
      .send({ role: 'editor' })
      .expect(200);
    expect(updateResponse.body).toMatchObject({
      id: target.id,
      role: 'editor',
    });
  });

  it('protects role administration and validates role targets', async () => {
    const author = await usersService.create({
      email: `role-author-${Date.now()}@test.dev`,
      password: 'author-password',
      role: 'author',
    });
    const admin = await usersService.create({
      email: `role-admin-self-${Date.now()}@test.dev`,
      password: 'admin-password',
      role: 'admin',
    });
    const adminToken = `Bearer ${jwt.sign({
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    })}`;
    const authorToken = `Bearer ${jwt.sign({
      sub: author.id,
      email: author.email,
      role: 'author',
    })}`;

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', authorToken)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/users/${author.id}/role`)
      .set('Authorization', authorToken)
      .send({ role: 'editor' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/users/${author.id}/role`)
      .set('Authorization', adminToken)
      .send({ role: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/users/00000000-0000-0000-0000-000000000000/role')
      .set('Authorization', adminToken)
      .send({ role: 'editor' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/users/${admin.id}/role`)
      .set('Authorization', adminToken)
      .send({ role: 'editor' })
      .expect(403);
  });

  it('allows the configured frontend origin with credentials', async () => {
    const response = await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('sets, rotates and revokes the refresh cookie', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: loginEmail, password: loginPassword })
      .expect(200);
    const loginCookie = loginResponse.headers['set-cookie']?.[0];

    const loginBody = loginResponse.body as { accessToken?: unknown };
    expect(loginBody.accessToken).toBeDefined();
    expect(loginCookie).toContain('refreshToken=');
    expect(loginCookie).toContain('HttpOnly');
    expect(loginCookie).toContain('Path=/auth');
    expect(loginCookie).toContain('SameSite=Lax');

    const storedTokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, loginUserId));
    expect(storedTokens).toHaveLength(1);
    expect(loginCookie).not.toContain(storedTokens[0].tokenHash);

    const oldCookie = loginCookie.split(';')[0];
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(200);
    const rotatedCookie = refreshResponse.headers['set-cookie']?.[0];

    const refreshBody = refreshResponse.body as { accessToken?: unknown };
    expect(refreshBody.accessToken).toBeDefined();
    expect(rotatedCookie).toBeDefined();
    expect(rotatedCookie).not.toBe(loginCookie);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(401);

    const currentCookie = rotatedCookie?.split(';')[0];
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', currentCookie ?? '')
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', currentCookie ?? '')
      .expect(401);
  });

  it('removes expired refresh tokens during cleanup', async () => {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, loginUserId));
    await db.insert(refreshTokens).values({
      userId: loginUserId,
      tokenHash: `expired-${Date.now()}`,
      expiresAt: new Date(Date.now() - 1_000),
    });

    const removed = await new RefreshTokenService().removeExpired();

    expect(removed).toBeGreaterThanOrEqual(1);
    const expiredRows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, loginUserId));
    expect(expiredRows).toHaveLength(0);
  });

  it('rejects and deletes an expired refresh token when it is used', async () => {
    const expiredToken = `expired-cookie-${Date.now()}`;
    const expiredHash = createHash('sha256').update(expiredToken).digest('hex');
    await db.insert(refreshTokens).values({
      userId: loginUserId,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);

    const deletedRows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, expiredHash));
    expect(deletedRows).toHaveLength(0);
  });
});
