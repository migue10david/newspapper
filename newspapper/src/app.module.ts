import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { MediaModule } from './media/media.module';
import { NewsModule } from './news/news.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { SettingsModule } from './settings/settings.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';
import { InteractionsModule } from './interactions/interactions.module';
import { EngagementModule } from './engagement/engagement.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CategoriesModule,
    TagsModule,
    AuthorsModule,
    NewsModule,
    MediaModule,
    SchedulingModule,
    SettingsModule,
    InteractionsModule,
    EngagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
