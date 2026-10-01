import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { PublicNewsController } from './public-news.controller';
import { PublicNewsService } from './public-news.service';
import { NewsService } from './news.service';
import { SlugService } from './slug.service';
import { StateMachine } from './state-machine';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [NewsController, PublicNewsController],
  providers: [NewsService, PublicNewsService, SlugService, StateMachine],
  exports: [NewsService],
})
export class NewsModule {}
