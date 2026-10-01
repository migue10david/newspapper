import { IsIn } from 'class-validator';
import { USER_ROLES, type UserRole } from './create-user.dto';

export class UpdateUserRoleDto {
  @IsIn(USER_ROLES)
  role!: UserRole;
}
