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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/guards/auth.guard';
import { CreateNewsDto } from './dto/create-news.dto';
import { TransitionDto } from './dto/transition.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { ManageNewsQueryDto } from './dto/news-search.dto';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Roles('author', 'admin')
  @Post()
  create(@Body() dto: CreateNewsDto, @CurrentUser() user: JwtPayload) {
    return this.newsService.create(dto, user);
  }

  @Roles('author', 'editor', 'admin')
  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: NewsQueryDto) {
    return this.newsService.findAll(user, query);
  }

  @Roles('author', 'editor', 'admin')
  @Get('manage')
  manage(@CurrentUser() user: JwtPayload, @Query() query: ManageNewsQueryDto) {
    return this.newsService.findManage(user, query);
  }

  @Roles('author', 'editor', 'admin')
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.newsService.findOne(id, user);
  }

  @Roles('author', 'editor', 'admin')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.newsService.update(id, dto, user);
  }

  @Roles('author', 'editor', 'admin')
  @Post(':id/transition')
  @HttpCode(200)
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.newsService.transition(id, dto, user);
  }

  @Roles('author', 'editor', 'admin')
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.newsService.remove(id, user);
  }
}
