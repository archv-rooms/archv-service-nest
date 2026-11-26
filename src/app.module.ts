import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { PlatformsModule } from './platforms/platforms.module';
import { LibraryModule } from './library/library.module';
import { RoomsModule } from './rooms/rooms.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SessionsModule } from './sessions/sessions.module';
import { SavesModule } from './saves/saves.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { FriendsModule } from './friends/friends.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    PlatformsModule,
    LibraryModule,
    RoomsModule,
    NotificationsModule,
    SessionsModule,
    SavesModule,
    LeaderboardModule,
    FriendsModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
