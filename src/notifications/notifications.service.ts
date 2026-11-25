import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotificationInput {
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string | number>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async unreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });

    return { count };
  }

  async markAsRead(userId: number, id: number) {
    await this.findOwned(userId, id);
    await this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async remove(userId: number, id: number) {
    await this.findOwned(userId, id);
    await this.prisma.notification.delete({ where: { id } });
  }

  async create(input: CreateNotificationInput) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data ?? {},
        },
      });
    } catch (error) {
      console.log('ERRO CREATE NOTIFICATION:', error);
    }
  }

  private async findOwned(userId: number, id: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== userId) {
      throw new ForbiddenException('Ação não permitida.');
    }

    return notification;
  }
}
