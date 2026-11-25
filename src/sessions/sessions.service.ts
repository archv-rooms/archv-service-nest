import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: number, gameId: number | string) {
    const session = await this.prisma.gameSession.create({
      data: { userId, gameId: Number(gameId) },
    });

    return { session };
  }

  async end(userId: number, id: number) {
    const session = await this.prisma.gameSession.findFirst({ where: { id, userId } });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada.');
    }

    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

    const updated = await this.prisma.gameSession.update({
      where: { id },
      data: { endedAt, duration },
    });

    return { session: updated };
  }

  async history(userId: number) {
    const sessions = await this.prisma.gameSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        game: { select: { id: true, title: true, console: true, image: true } },
      },
    });

    return { sessions };
  }
}
