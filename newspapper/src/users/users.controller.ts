import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserAuthorDto } from './dto/update-user-author.dto';
import { UsersService } from './users.service';
import { toPublicUser } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto).then(toPublicUser);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll().then((users) => users.map(toPublicUser));
  }

  @Roles('admin')
  @Patch(':id/role')
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService
      .updateRole(id, dto, currentUser.sub)
      .then(toPublicUser);
  }

  @Roles('admin')
  @Patch(':id/author')
  updateAuthor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserAuthorDto,
  ) {
    return this.usersService.updateAuthor(id, dto.authorId).then(toPublicUser);
  }
}
