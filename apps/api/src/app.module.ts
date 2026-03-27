import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { PostsModule } from './modules/posts/posts.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PublicModule } from './modules/public/public.module';
import { RecycleBinModule } from './modules/recycle-bin/recycle-bin.module';
import { RolesModule } from './modules/roles/roles.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AssistantModule,
    AuthModule,
    RolesModule,
    UsersModule,
    DashboardModule,
    NotificationsModule,
    RecycleBinModule,
    OperationLogsModule,
    PostsModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    MediaModule,
    SettingsModule,
    PublicModule,
  ],
})
export class AppModule {}
