import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/guards/auth.guard';
import {
  ReadingHistoryQueryDto,
  SavedNewsQueryDto,
} from './dto/engagement.dto';
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

  @Roles('author', 'editor', 'admin')
  @Get('me/reading-history')
  listReadingHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReadingHistoryQueryDto,
  ) {
    return this.engagementService.listReadingHistory(user, query);
  }

  @Roles('author', 'editor', 'admin')
  @Post('news/:id/read')
  recordReading(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.engagementService.recordReading(id, user);
  }

  @Roles('author', 'editor', 'admin')
  @Delete('me/reading-history/:newsId')
  @HttpCode(204)
  async removeReadingHistoryEntry(
    @Param('newsId', ParseUUIDPipe) newsId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.engagementService.removeReadingHistoryEntry(newsId, user);
  }

  @Roles('author', 'editor', 'admin')
  @Delete('me/reading-history')
  @HttpCode(204)
  async clearReadingHistory(@CurrentUser() user: JwtPayload) {
    await this.engagementService.clearReadingHistory(user);
  }
}
