import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        onboardingDone: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async updateName(userId: number, name: string) {
    const trimmed = name.trim();

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: trimmed },
      select: { id: true, name: true },
    });

    return { name: user.name };
  }

  async setUsername(userId: number, username: string) {
    const trimmed = username.trim().toLowerCase();

    const exists = await this.prisma.user.findUnique({ where: { username: trimmed } });
    if (exists && exists.id !== userId) {
      throw new BadRequestException('Username já em uso.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username: trimmed },
      select: { id: true, username: true },
    });

    return { username: user.username };
  }

  async updateAvatarUrl(userId: number, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return { avatar: user.avatar };
  }

  async updateAvatarFile(userId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const result = await this.cloudinary.uploadFromBuffer(file.buffer, 'archv-rooms/avatars');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: result.secure_url },
    });

    return { avatar: user.avatar };
  }

  async completeOnboarding(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDone: true },
    });
  }

  async getPaymentHistory(userId: number) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { plan: true } },
      },
    });
  }

  async toggleFavorite(userId: number, gameId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_gameId: { userId, gameId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({ data: { userId, gameId } });
    return { favorited: true };
  }

  async getFavorites(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { game: true },
    });

    return favorites.map((f: { game: unknown }) => f.game);
  }

  async getPublicProfile(targetId: number, requesterId: number) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: requesterId, receiverId: targetId },
          { senderId: targetId, receiverId: requesterId },
        ],
      },
    });

    if (!friendship && requesterId !== targetId) {
      throw new ForbiddenException('Você só pode ver o perfil de amigos.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, username: true, avatar: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const sessions = await this.prisma.gameSession.findMany({
      where: { userId: targetId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: {
        game: { select: { id: true, title: true, console: true, image: true } },
      },
    });

    const totalSeconds = sessions.reduce(
      (sum: number, s: { duration: number | null }) => sum + (s.duration || 0),
      0,
    );

    const gameMap: Record<number, { game: (typeof sessions)[number]['game']; totalSeconds: number; sessionCount: number }> = {};
    for (const s of sessions) {
      if (!s.game) continue;
      if (!gameMap[s.game.id]) {
        gameMap[s.game.id] = { game: s.game, totalSeconds: 0, sessionCount: 0 };
      }
      gameMap[s.game.id].totalSeconds += s.duration || 0;
      gameMap[s.game.id].sessionCount += 1;
    }

    const topGames = Object.values(gameMap)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 5);

    const recentSessions = sessions.slice(0, 5);

    return {
      user,
      stats: {
        totalSeconds,
        totalSessions: sessions.length,
        uniqueGames: Object.keys(gameMap).length,
      },
      topGames,
      recentSessions,
    };
  }
}
