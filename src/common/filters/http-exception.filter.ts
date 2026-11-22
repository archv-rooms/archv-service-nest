import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Erro interno do servidor.';

    if (isHttpException) {
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const bodyMessage = (body as { message: string | string[] }).message;
        message = Array.isArray(bodyMessage) ? bodyMessage[0] : bodyMessage;
      }
    } else {
      console.log('ERRO NÃO TRATADO:', exception);
    }

    response.status(status).json({
      success: false,
      data: {},
      message,
    });
  }
}
