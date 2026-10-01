import { IsIn, IsInt, Min } from 'class-validator';
import { COMMENT_STATUSES, type CommentStatus } from '../constants';

export class ModerateCommentDto {
  @IsIn(COMMENT_STATUSES)
  status!: CommentStatus;

  @IsInt()
  @Min(1)
  version!: number;
}
