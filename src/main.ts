import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, stopAtFirstError: true }));

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Seja bem-vindo ao Archv.rooms, aproveite a estadia! | Servidor rodando na porta ${port}`);
}

bootstrap();
