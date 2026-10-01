import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export const BLOCK_TYPES = ['paragraph', 'heading', 'list', 'image'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export class RichTextBlockDto {
  @IsIn(BLOCK_TYPES)
  type!: BlockType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  items?: string[];

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  alt?: string;
}

export class BodyField {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RichTextBlockDto)
  body!: RichTextBlockDto[];
}
