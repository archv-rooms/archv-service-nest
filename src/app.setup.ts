import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

export function configureApp(app: NestExpressApplication) {
  app.set('etag', false);
  app.useBodyParser('json', { limit: '15mb' });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, stopAtFirstError: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
}
