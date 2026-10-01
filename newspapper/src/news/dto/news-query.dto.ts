import { IsIn, IsOptional } from 'class-validator';
import { NEWS_STATUSES, NewsStatus } from '../state-machine';

export class NewsQueryDto {
  @IsOptional()
  @IsIn(NEWS_STATUSES)
  status?: NewsStatus;
}
