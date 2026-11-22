import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RoomsRuntimeService } from './rooms-runtime.service';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const LOBBY_IDLE_LIMIT_MS = 15 * 60 * 1000;
const STARTED_ROOM_LIMIT_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class RoomsCleanupService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: RoomsRuntimeService,
    private readonly realtime: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.removeStaleRooms().catch((error) => console.error('[rooms cleanup]', error));
    }, SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async removeStaleRooms(): Promise<number> {
    const rooms: { id: number }[] = await this.prisma.room.findMany({ select: { id: true } });
    const now = Date.now();

    const staleIds = rooms.filter((room) => this.isStale(room.id, now)).map((room) => room.id);
    if (staleIds.length === 0) return 0;

    await this.prisma.room.deleteMany({ where: { id: { in: staleIds } } });
    staleIds.forEach((id) => this.runtime.delete(id));
    this.realtime.emitRoomsUpdated();

    return staleIds.length;
  }

  private isStale(roomId: number, now: number): boolean {
    const runtime = this.runtime.get(roomId);

    if (runtime.startedAt) {
      return now - runtime.startedAt > STARTED_ROOM_LIMIT_MS;
    }

    return now - runtime.lastActivityAt > LOBBY_IDLE_LIMIT_MS;
  }
}
