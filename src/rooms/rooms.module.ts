import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomsRuntimeService } from './rooms-runtime.service';
import { RoomsCleanupService } from './rooms-cleanup.service';

@Module({
  imports: [PushModule, RealtimeModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRuntimeService, RoomsCleanupService],
})
export class RoomsModule {}
