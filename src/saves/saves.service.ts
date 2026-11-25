import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: number, gameId: number) {
    return this.prisma.gameSave.findMany({
      where: { userId, gameId },
      orderBy: { slot: 'asc' },
    });
  }

  upsert(userId: number, gameId: number, slot: number | string | undefined, saveData: any) {
    const slotNumber = slot === undefined ? 1 : Number(slot);

    return this.prisma.gameSave.upsert({
      where: { userId_gameId_slot: { userId, gameId, slot: slotNumber } },
      update: { saveData },
      create: { userId, gameId, slot: slotNumber, saveData },
    });
  }

  async remove(userId: number, gameId: number, slot: number) {
    if (!Number.isInteger(gameId) || !Number.isInteger(slot)) {
      throw new BadRequestException('gameId e slot inválidos.');
    }

    const result = await this.prisma.gameSave.deleteMany({
      where: { userId, gameId, slot },
    });

    if (result.count === 0) {
      throw new NotFoundException('Save não encontrado.');
    }
  }
}
