import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { COMMENT_STATUSES, type CommentStatus } from '../constants';

export class ManageCommentsQueryDto {
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

  @IsOptional()
  @IsIn(COMMENT_STATUSES)
  status?: CommentStatus;

  @IsOptional()
  @IsUUID()
  newsId?: string;
}
