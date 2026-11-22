import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [AuthModule, CloudinaryModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
