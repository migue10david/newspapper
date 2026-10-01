import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '../database/database';
import { news } from '../database/schema';

@Injectable()
export class SchedulingService {
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    await this.publishDueScheduled();
  }

  async publishDueScheduled(): Promise<number> {
    const now = new Date();
    const due = await db
      .update(news)
      .set({ status: 'published', updatedAt: now })
      .where(and(eq(news.status, 'scheduled'), lte(news.publishedAt, now)))
      .returning({ id: news.id });
    return due.length;
  }
}
