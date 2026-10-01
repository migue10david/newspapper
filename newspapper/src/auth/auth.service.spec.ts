import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { pool } from '../database/database';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthService', () => {
  const usersService = new UsersService();
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });
  const refreshTokenService = new RefreshTokenService();
  const service = new AuthService(usersService, jwt, refreshTokenService);

  afterAll(async () => {
    await pool.end();
  });

  it('returns a signed JWT for valid credentials', async () => {
    const email = `login-${Date.now()}@test.dev`;
    await usersService.create({
      email,
      password: 'secret-password',
      role: 'editor',
    });

    const result = await service.login({ email, password: 'secret-password' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const payload = jwt.verify<{ sub: string; email: string; role: string }>(
      result.accessToken,
    );
    expect(payload.email).toBe(email);
    expect(payload.role).toBe('editor');
  });

  it('rejects invalid password with 401', async () => {
    const email = `wrong-${Date.now()}@test.dev`;
    await usersService.create({
      email,
      password: 'secret-password',
      role: 'author',
    });
    await expect(
      service.login({ email, password: 'bad-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects unknown email with 401', async () => {
    await expect(
      service.login({ email: 'nobody@test.dev', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('registers a public user as an author without creating a refresh token', async () => {
    const createUser = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: 'new-author@test.dev',
      role: 'author',
    });
    const createRefreshToken = jest.fn();
    const mockedUsersService = {
      create: createUser,
    } as unknown as UsersService;
    const mockedRefreshTokenService = {
      create: createRefreshToken,
    } as unknown as RefreshTokenService;
    const mockedService = new AuthService(
      mockedUsersService,
      jwt,
      mockedRefreshTokenService,
    );

    const result = await mockedService.register({
      email: 'new-author@test.dev',
      password: 'password-123',
    });

    expect(result).toEqual({
      id: 'user-id',
      email: 'new-author@test.dev',
      role: 'author',
    });
    expect(createUser).toHaveBeenCalledWith({
      email: 'new-author@test.dev',
      password: 'password-123',
      role: 'author',
    });
    expect(createRefreshToken).not.toHaveBeenCalled();
  });
});
