import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/guards/auth.guard';
import { SavedNewsQueryDto } from './dto/engagement.dto';
import { EngagementService } from './engagement.service';

@Controller()
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Roles('author', 'editor', 'admin')
  @Get('me/saved-news')
  listSavedNews(
    @CurrentUser() user: JwtPayload,
    @Query() query: SavedNewsQueryDto,
  ) {
    return this.engagementService.listSavedNews(user, query);
  }

  @Roles('author', 'editor', 'admin')
  @Put('news/:id/save')
  saveNews(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.engagementService.saveNews(id, user);
  }

  @Roles('author', 'editor', 'admin')
  @Delete('news/:id/save')
  @HttpCode(204)
  async removeSavedNews(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.engagementService.removeSavedNews(id, user);
  }
}
