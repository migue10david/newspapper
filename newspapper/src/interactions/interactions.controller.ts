import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtPayload } from '../auth/guards/auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ManageCommentsQueryDto } from './dto/manage-comments-query.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { ReactionDto } from './dto/reaction.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InteractionsService } from './interactions.service';

@Controller()
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Public()
  @Get('public/news/:slug/interactions')
  publicInteractions(@Param('slug') slug: string) {
    return this.interactionsService.getPublicInteractions(slug);
  }

  @Roles('author', 'editor', 'admin')
  @Post('news/:id/comments')
  createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interactionsService.createComment(id, dto, user);
  }

  @Roles('author', 'editor', 'admin')
  @Patch('comments/:id')
  updateComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interactionsService.updateComment(id, dto, user);
  }

  @Roles('author', 'editor', 'admin')
  @Delete('comments/:id')
  @HttpCode(204)
  async removeComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.interactionsService.removeComment(id, user);
  }

  @Roles('editor', 'admin')
  @Get('comments/manage')
  listForModeration(@Query() query: ManageCommentsQueryDto) {
    return this.interactionsService.listForModeration(query);
  }

  @Roles('editor', 'admin')
  @Patch('comments/:id/moderation')
  moderateComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateCommentDto,
  ) {
    return this.interactionsService.moderateComment(id, dto);
  }

  @Roles('author', 'editor', 'admin')
  @Put('news/:id/reaction')
  setReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interactionsService.setReaction(id, dto, user);
  }

  @Roles('author', 'editor', 'admin')
  @Delete('news/:id/reaction')
  @HttpCode(204)
  async removeReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.interactionsService.removeReaction(id, user);
  }
}
