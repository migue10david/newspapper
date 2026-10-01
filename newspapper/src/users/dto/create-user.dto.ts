import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export const USER_ROLES = ['author', 'editor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(USER_ROLES)
  role!: UserRole;
}
