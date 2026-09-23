import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// No Express, cada função de controller tinha seu próprio try/catch que
// montava manualmente { success: false, data: {}, message: '...' }. Esse
// filtro faz a mesma coisa uma única vez, para toda a aplicação: qualquer
// exceção lançada em qualquer service (throw new NotFoundException(...),
// por exemplo) passa por aqui antes de virar resposta HTTP.
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
      // O class-validator (usado nos DTOs) faz o Nest lançar uma exceção
      // cujo "message" é um array de erros. Nos outros casos é uma string
      // única, igual ao que o authController.js já retornava.
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const bodyMessage = (body as { message: string | string[] }).message;
        message = Array.isArray(bodyMessage) ? bodyMessage[0] : bodyMessage;
      }
    } else {
      // Erro não previsto (bug, falha de conexão com o banco, etc.) — loga
      // no servidor mas não expõe detalhes internos para quem chamou a API.
      console.log('ERRO NÃO TRATADO:', exception);
    }

    response.status(status).json({
      success: false,
      data: {},
      message,
    });
  }
}
