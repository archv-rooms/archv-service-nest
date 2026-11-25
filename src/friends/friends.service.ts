import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { NotificationsService } from '../notifications/notifications.service';

const friendSelect = { id: true, username: true, email: true, avatar: true };

interface FriendUser {
  id: number;
  username: string | null;
  email: string;
  avatar: string | null;
}

interface FriendshipWithUsers {
  id: number;
  senderId: number;
  receiverId: number;
  sender: FriendUser;
  receiver: FriendUser;
}

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendRequest(senderId: number, receiverId: number | string) {
    const receiverIdInt = parseInt(String(receiverId));

    if (senderId === receiverIdInt) {
      throw new BadRequestException('Você não pode se adicionar.');
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiverIdInt },
          { senderId: receiverIdInt, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Convite já existe.');
    }

    const friendship = await this.prisma.friendship.create({
      data: { senderId, receiverId: receiverIdInt },
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true },
    });

    const body = `${sender?.username ?? 'Alguém'} quer ser seu amigo.`;

    await this.notifications.create({
      userId: receiverIdInt,
      type: 'friend_request',
      title: 'Novo convite de amizade',
      body,
      data: { friendshipId: friendship.id, senderId },
    });

    this.push.sendPush(receiverIdInt, 'Novo convite de amizade', body, {
      type: 'friend_request',
      friendshipId: friendship.id,
    });

    return { friendship };
  }

  async respond(userId: number, id: number, status: string) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } });

    if (!friendship || friendship.receiverId !== userId) {
      throw new ForbiddenException('Ação não permitida.');
    }

    const updated = await this.prisma.friendship.update({
      where: { id },
      data: { status },
    });

    if (status === 'accepted') {
      const receiver = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      const body = `${receiver?.username ?? 'Alguém'} aceitou seu convite de amizade.`;

      await this.notifications.create({
        userId: friendship.senderId,
        type: 'friend_accepted',
        title: 'Convite aceito!',
        body,
        data: { friendshipId: friendship.id, receiverId: userId },
      });

      this.push.sendPush(friendship.senderId, 'Convite aceito!', body, {
        type: 'friend_accepted',
        friendshipId: friendship.id,
      });
    }

    return { updated };
  }

  async list(userId: number) {
    const friendships: FriendshipWithUsers[] = await this.prisma.friendship.findMany({
      where: {
        AND: [{ status: 'accepted' }, { OR: [{ senderId: userId }, { receiverId: userId }] }],
      },
      include: {
        sender: { select: friendSelect },
        receiver: { select: friendSelect },
      },
    });

    return friendships.map((friendship) => {
      const user = friendship.senderId === userId ? friendship.receiver : friendship.sender;
      return { ...user, friendshipId: friendship.id };
    });
  }

  pending(userId: number) {
    return this.prisma.friendship.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: { sender: { select: friendSelect } },
    });
  }

  async search(userId: number, query?: string) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query muito curta.');
    }

    return this.prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' },
        NOT: { id: userId },
      },
      select: friendSelect,
      take: 10,
    });
  }

  async remove(userId: number, id: number) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } });

    if (!friendship || (friendship.senderId !== userId && friendship.receiverId !== userId)) {
      throw new ForbiddenException('Ação não permitida.');
    }

    await this.prisma.friendship.delete({ where: { id } });
  }

  async activity(userId: number) {
    const friendships: { senderId: number; receiverId: number }[] =
      await this.prisma.friendship.findMany({
        where: {
          AND: [{ status: 'accepted' }, { OR: [{ senderId: userId }, { receiverId: userId }] }],
        },
        select: { senderId: true, receiverId: true },
      });

    const friendIds = friendships.map((friendship) =>
      friendship.senderId === userId ? friendship.receiverId : friendship.senderId,
    );

    const activities = await Promise.all(
      friendIds.map(async (friendId) => {
        const user = await this.prisma.user.findUnique({
          where: { id: friendId },
          select: { id: true, username: true, avatar: true },
        });

        const lastSession = await this.prisma.gameSession.findFirst({
          where: { userId: friendId },
          orderBy: { startedAt: 'desc' },
          include: {
            game: { select: { id: true, title: true, console: true, image: true } },
          },
        });

        if (!lastSession) {
          return { user, status: 'inactive', game: null, since: null };
        }

        if (!lastSession.endedAt) {
          return { user, status: 'playing', game: lastSession.game, since: lastSession.startedAt };
        }

        const daysSince = (Date.now() - new Date(lastSession.endedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 7) {
          return { user, status: 'inactive', game: null, since: null };
        }

        return { user, status: 'last_played', game: lastSession.game, since: lastSession.endedAt };
      }),
    );

    const order: Record<string, number> = { playing: 0, last_played: 1, inactive: 2 };
    activities.sort((a, b) => order[a.status] - order[b.status]);

    return activities;
  }
}
