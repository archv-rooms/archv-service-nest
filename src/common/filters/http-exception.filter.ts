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
    const parserStatus = this.getParserStatus(exception);
    const status = isHttpException
      ? exception.getStatus()
      : parserStatus ?? HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Erro interno do servidor.';

    if (isHttpException) {
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const bodyMessage = (body as { message: string | string[] }).message;
        message = Array.isArray(bodyMessage) ? bodyMessage[0] : bodyMessage;
      }
    } else if (parserStatus === HttpStatus.PAYLOAD_TOO_LARGE) {
      message = 'Corpo da requisição muito grande.';
    } else if (parserStatus === HttpStatus.BAD_REQUEST) {
      message = 'Corpo da requisição inválido.';
    } else {
      console.log('ERRO NÃO TRATADO:', exception);
    }

    response.status(status).json({
      success: false,
      data: {},
      message,
    });
  }

  private getParserStatus(exception: unknown): number | null {
    const error = exception as { status?: number; type?: string };
    if (error?.type === 'entity.too.large') return HttpStatus.PAYLOAD_TOO_LARGE;
    if (error?.type === 'entity.parse.failed') return HttpStatus.BAD_REQUEST;
    return null;
  }
}
