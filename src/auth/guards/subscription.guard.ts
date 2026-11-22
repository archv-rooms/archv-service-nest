import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      request.accessLevel = 0;
      return true;
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
      include: { plan: true },
    });

    request.accessLevel = subscription ? subscription.plan.accessLevel : 0;
    return true;
  }
}
