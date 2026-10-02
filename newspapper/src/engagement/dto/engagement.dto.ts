import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class EngagementPaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  size = 20;
}

export class SavedNewsQueryDto extends EngagementPaginationQueryDto {}

export class ReadingHistoryQueryDto extends EngagementPaginationQueryDto {}

export class NewsEngagementDto {
  @IsUUID()
  newsId!: string;
}

export interface PaginatedEngagementResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}
