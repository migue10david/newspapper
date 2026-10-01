import { IsOptional, IsUUID } from 'class-validator';

export class UpdateUserAuthorDto {
  @IsOptional()
  @IsUUID()
  authorId!: string | null;
}
