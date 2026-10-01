import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { NewsSearchQueryDto } from './dto/news-search.dto';
import { PublicNewsService } from './public-news.service';

@Controller('public/news')
export class PublicNewsController {
  constructor(private readonly publicNewsService: PublicNewsService) {}

  @Public()
  @Get()
  list(@Query() query: NewsSearchQueryDto) {
    return this.publicNewsService.listPublished(query);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.publicNewsService.findPublishedBySlug(slug);
  }
}
