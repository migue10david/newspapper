import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { eq, lte } from 'drizzle-orm';
import { db } from '../database/database';
import { refreshTokens } from '../database/schema';
import { REFRESH_TOKEN_TTL_MS } from './auth.constants';

interface RotatedRefreshToken {
  userId: string;
  token: string;
}

@Injectable()
export class RefreshTokenService {
  async create(userId: string): Promise<string> {
    const token = this.generateToken();
    await db.insert(refreshTokens).values({
      userId,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    return token;
  }

  async rotate(token: string): Promise<RotatedRefreshToken> {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const rotated = await db.transaction(async (transaction) => {
      const [storedToken] = await transaction
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1);

      if (!storedToken) {
        return undefined;
      }

      await transaction
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, storedToken.id));

      if (storedToken.expiresAt <= now) {
        return undefined;
      }

      const nextToken = this.generateToken();
      await transaction.insert(refreshTokens).values({
        userId: storedToken.userId,
        tokenHash: this.hashToken(nextToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });

      return { userId: storedToken.userId, token: nextToken };
    });

    if (!rotated) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return rotated;
  }

  async remove(token: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, this.hashToken(token)));
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async removeExpired(): Promise<number> {
    const deleted = await db
      .delete(refreshTokens)
      .where(lte(refreshTokens.expiresAt, new Date()))
      .returning({ id: refreshTokens.id });
    return deleted.length;
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
