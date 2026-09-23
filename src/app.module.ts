import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // isGlobal: true evita ter que reimportar o ConfigModule em cada módulo
    // que precisar ler variáveis de ambiente (equivalente ao 'dotenv/config'
    // que era importado uma vez no topo do server.js).
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    // Próximos módulos a entrar aqui: Users, Games, Platforms, Library,
    // Plans/Checkout, Saves, Sessions, Friends, Leaderboard, Notifications,
    // Chat, Admin, Webhook, Upload, Donation.
  ],
})
export class AppModule {}
