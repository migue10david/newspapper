import { IsIn, IsInt, Min } from 'class-validator';
import { NEWS_STATUSES, NewsStatus } from '../state-machine';

export class TransitionDto {
  @IsIn(NEWS_STATUSES)
  target!: NewsStatus;

  @IsInt()
  @Min(1)
  version!: number;
}
