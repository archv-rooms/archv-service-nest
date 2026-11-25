import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SessionTime {
  userId: number;
  duration: number | null;
  startedAt: Date;
  endedAt: Date | null;
}

interface ProfileSession {
  gameId: number;
  duration: number | null;
  startedAt: Date;
  endedAt: Date | null;
  game: { id: number; title: string };
}

function secondsOf(session: { duration: number | null; startedAt: Date; endedAt: Date | null }) {
  if (session.duration !== null && session.duration !== undefined) {
    return session.duration;
  }
  if (session.endedAt) {
    return Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000);
  }
  return 0;
}

function sumByUser(sessions: SessionTime[]) {
  const totals: Record<number, number> = {};
  for (const session of sessions) {
    totals[session.userId] = (totals[session.userId] ?? 0) + secondsOf(session);
  }
  return totals;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async globalRanking(gameId?: string) {
    const where = gameId ? { gameId: parseInt(gameId) } : {};

    const sessions: SessionTime[] = await this.prisma.gameSession.findMany({
      where,
      select: { userId: true, duration: true, startedAt: true, endedAt: true },
    });

    const totals = sumByUser(sessions);

    const sorted = Object.entries(totals)
      .map(([userId, total]) => ({ userId: parseInt(userId), total }))
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);

    const users: { id: number; name: string; username: string | null; avatar: string | null }[] =
      await this.prisma.user.findMany({
        where: { id: { in: sorted.map((entry) => entry.userId) } },
        select: { id: true, name: true, username: true, avatar: true },
      });

    const ranking = sorted.map((entry, index) => ({
      position: index + 1,
      user: users.find((user) => user.id === entry.userId),
      totalDuration: entry.total,
    }));

    return { ranking };
  }

  async gameHistory(gameId?: string) {
    const where = gameId ? { gameId: parseInt(gameId) } : {};

    const sessions = await this.prisma.gameSession.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        game: { select: { id: true, title: true, console: true, image: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    return { sessions };
  }

  async games() {
    const games = await this.prisma.game.findMany({
      select: { id: true, title: true, console: true, image: true },
      orderBy: { title: 'asc' },
    });

    return { games };
  }

  async playerProfile(username: string, currentUserId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, name: true, username: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const withDuration = await this.sessionsWithTime(user.id);

    const bestSession = [...withDuration].sort((a, b) => a.calc - b.calc)[0];

    const gameCount: Record<string, number> = {};
    for (const session of withDuration) {
      gameCount[session.game.title] = (gameCount[session.game.title] ?? 0) + 1;
    }
    const favoriteGame = Object.entries(gameCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const allSessions: SessionTime[] = await this.prisma.gameSession.findMany({
      select: { userId: true, duration: true, startedAt: true, endedAt: true },
    });
    const ranked = Object.entries(sumByUser(allSessions))
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1]);
    const rank = ranked.findIndex(([id]) => parseInt(id) === user.id) + 1;

    const commonGames: { gameName: string; yourTime: number; theirTime: number }[] = [];
    if (currentUserId && currentUserId !== user.id) {
      const yours = await this.sessionsWithTime(currentUserId);
      const theirGameIds = [...new Set(withDuration.map((session) => session.game.id))];

      for (const gameId of theirGameIds) {
        const yourBest = yours.filter((s) => s.game.id === gameId).sort((a, b) => a.calc - b.calc)[0];
        const theirBest = withDuration.filter((s) => s.game.id === gameId).sort((a, b) => a.calc - b.calc)[0];

        if (yourBest && theirBest) {
          commonGames.push({
            gameName: theirBest.game.title,
            yourTime: yourBest.calc,
            theirTime: theirBest.calc,
          });
        }
      }
    }

    return {
      userId: user.id,
      username: user.username || user.name,
      rank: rank || null,
      bestTime: bestSession?.calc || 0,
      totalMatches: withDuration.length,
      totalGames: Object.keys(gameCount).length,
      favoriteGame,
      memberSince: user.createdAt,
      recentMatches: withDuration.slice(0, 10).map((session) => ({
        gameId: session.gameId,
        gameName: session.game.title,
        durationSeconds: session.calc,
        playedAt: session.endedAt ?? session.startedAt,
      })),
      commonGames,
    };
  }

  private async sessionsWithTime(userId: number) {
    const sessions: ProfileSession[] = await this.prisma.gameSession.findMany({
      where: { userId },
      include: { game: { select: { id: true, title: true } } },
      orderBy: { startedAt: 'desc' },
    });

    return sessions
      .map((session) => ({ ...session, calc: secondsOf(session) }))
      .filter((session) => session.calc > 0);
  }
}
