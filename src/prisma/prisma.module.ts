import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() faz esse módulo ser carregado uma única vez e ficar disponível
// para todos os outros módulos da aplicação, sem precisar importar o
// PrismaModule em cada um deles. É o equivalente a ter um único "prisma"
// compartilhado que todos os controllers do Express importavam.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
