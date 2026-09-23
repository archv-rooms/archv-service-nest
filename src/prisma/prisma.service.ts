import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// No Express, o projeto criava um "new PrismaClient()" em cada arquivo que
// precisava do banco. No Nest a ideia é ter uma única instância compartilhada
// por toda a aplicação, então esse serviço estende o PrismaClient e é
// registrado uma vez no PrismaModule (abaixo). Qualquer outro service pode
// injetar PrismaService no construtor e usar como se fosse o prisma normal,
// ex: this.prisma.user.findUnique(...).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
