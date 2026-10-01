import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  siteName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:https?:\/\/|\/)/iu, {
    message: 'logoUrl must be an absolute URL or a local path',
  })
  @MaxLength(500)
  logoUrl?: string | null;
}
