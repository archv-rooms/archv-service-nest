import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  getLibrary(accessLevel: number) {
    return this.prisma.game.findMany({
      where: { accessLevel: { lte: accessLevel } },
    });
  }
}
