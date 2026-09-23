import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Equivalente ao corsMiddleware (origin: true, credentials: true) do
  // Express — libera todas as origens, mantendo o suporte a cookies/headers
  // de autenticação.
  app.enableCors({ origin: true, credentials: true });

  // ValidationPipe global: é o que faz os decorators dos DTOs (@IsEmail,
  // @IsNotEmpty, etc.) realmente serem checados em toda rota da aplicação,
  // sem precisar chamar nada manualmente em cada controller.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, stopAtFirstError: true }));

  // Filtro que padroniza toda resposta de erro em { success, data, message }.
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Seja bem-vindo ao Archv.rooms, aproveite a estadia! | Servidor rodando na porta ${port}`);
}

bootstrap();
