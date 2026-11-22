import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const VALID_TOKEN = /^Expo(nent)?PushToken\[/;

@Injectable()
export class PushService {
  constructor(private readonly prisma: PrismaService) {}

  async sendPush(
    userIds: number | number[],
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ) {
    try {
      const ids = Array.isArray(userIds) ? userIds : [userIds];

      const users: { pushToken: string | null }[] = await this.prisma.user.findMany({
        where: { id: { in: ids }, pushToken: { not: null } },
        select: { pushToken: true },
      });

      const messages = users
        .filter((user) => user.pushToken && VALID_TOKEN.test(user.pushToken))
        .map((user) => ({
          to: user.pushToken,
          sound: 'default',
          title,
          body,
          data,
        }));

      if (messages.length === 0) return;

      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (error) {
      console.error('[sendPush]', error);
    }
  }
}
