import { IsIn } from 'class-validator';
import { REACTION_TYPES, type ReactionType } from '../constants';

export class ReactionDto {
  @IsIn(REACTION_TYPES)
  type!: ReactionType;
}
