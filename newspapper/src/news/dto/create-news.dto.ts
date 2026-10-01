import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { RichTextBlockDto } from './rich-text-block.dto';
import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case',
  })
  slug?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  summary!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RichTextBlockDto)
  body!: RichTextBlockDto[];

  @IsOptional()
  @IsUUID()
  imageId?: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
