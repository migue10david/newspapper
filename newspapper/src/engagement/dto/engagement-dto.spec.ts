import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  EngagementPaginationQueryDto,
  NewsEngagementDto,
  ReadingHistoryQueryDto,
  SavedNewsQueryDto,
} from './engagement.dto';

describe('Engagement DTOs', () => {
  it('accepts valid pagination and news identifiers', async () => {
    const pagination = new EngagementPaginationQueryDto();
    pagination.page = 2;
    pagination.size = 50;
    const newsDto = new NewsEngagementDto();
    newsDto.newsId = '11111111-1111-4111-8111-111111111111';
    const savedNewsQuery = new SavedNewsQueryDto();
    const readingHistoryQuery = new ReadingHistoryQueryDto();

    await expect(validate(pagination)).resolves.toHaveLength(0);
    await expect(validate(newsDto)).resolves.toHaveLength(0);
    await expect(validate(savedNewsQuery)).resolves.toHaveLength(0);
    await expect(validate(readingHistoryQuery)).resolves.toHaveLength(0);
  });

  it('rejects invalid pagination and UUID values', async () => {
    const pagination = new EngagementPaginationQueryDto();
    pagination.page = 0;
    pagination.size = 51;
    const newsDto = new NewsEngagementDto();
    newsDto.newsId = 'not-a-uuid';

    expect((await validate(pagination)).length).toBeGreaterThan(0);
    expect((await validate(newsDto)).length).toBeGreaterThan(0);
  });
});
