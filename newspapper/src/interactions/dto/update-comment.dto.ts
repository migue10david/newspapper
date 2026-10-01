import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;

  @IsInt()
  @Min(1)
  version!: number;
}
