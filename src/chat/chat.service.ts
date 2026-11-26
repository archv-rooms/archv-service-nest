import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const userSelect = { id: true, name: true, username: true, avatar: true };

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async conversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { conversations };
  }

  async directConversation(userId: number, friendId: number | string) {
    const friendIdInt = Number(friendId);

    const friend = await this.prisma.user.findUnique({ where: { id: friendIdInt } });
    if (!friend) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: friendIdInt } } },
        ],
      },
      include: { participants: true },
    });

    if (existing) {
      return { conversation: existing };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'direct',
        participants: { create: [{ userId }, { userId: friendIdInt }] },
      },
      include: { participants: true },
    });

    return { conversation };
  }

  async messages(userId: number, conversationId: number) {
    await this.assertParticipant(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });

    return { messages };
  }

  async sendMessage(userId: number, conversationId: number, content: string) {
    const text = content.trim();
    if (!text) {
      throw new BadRequestException('Mensagem vazia.');
    }

    await this.assertParticipant(userId, conversationId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content: text },
      include: { sender: { select: userSelect } },
    });

    this.realtime.emitNewMessage(conversationId, message);

    const others: { userId: number }[] = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, NOT: { userId } },
      select: { userId: true },
    });

    if (others.length > 0) {
      const senderName = message.sender.name || message.sender.username || 'Alguém';
      const preview = message.content.length > 100 ? message.content.slice(0, 100) + '...' : message.content;

      this.push.sendPush(
        others.map((other) => other.userId),
        senderName,
        preview,
        { type: 'message', conversationId },
      );
    }

    return { message };
  }

  private async assertParticipant(userId: number, conversationId: number) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Ação não permitida.');
    }
  }
}
