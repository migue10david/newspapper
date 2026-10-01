export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? '1h';

const configuredRefreshTokenTtlDays = Number.parseInt(
  process.env.REFRESH_TOKEN_TTL_DAYS ?? '7',
  10,
);

export const REFRESH_TOKEN_TTL_DAYS =
  Number.isFinite(configuredRefreshTokenTtlDays) &&
  configuredRefreshTokenTtlDays > 0
    ? configuredRefreshTokenTtlDays
    : 7;
export const REFRESH_TOKEN_TTL_MS =
  REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};
