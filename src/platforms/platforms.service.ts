import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatforms() {
    const grouped: { console: string; _count: { console: number } }[] =
      await this.prisma.game.groupBy({
        by: ['console'],
        _count: { console: true },
        orderBy: { _count: { console: 'desc' } },
      });

    const totalGames = grouped.reduce((sum, p) => sum + p._count.console, 0);
    const max = grouped[0]?._count.console ?? 1;

    const platforms = grouped.map((p) => ({
      name: p.console.toUpperCase(),
      count: p._count.console,
      pct: Math.round((p._count.console / max) * 100),
    }));

    return {
      platforms,
      totalGames,
      totalPlatforms: platforms.length,
    };
  }
}
