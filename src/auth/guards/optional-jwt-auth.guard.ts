import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Mesma estratégia 'jwt', mas sobrescrevendo handleRequest para nunca
// bloquear a requisição: se o token for válido, req.user vem preenchido;
// se faltar ou for inválido, req.user fica undefined e a rota segue como
// "convidado" — exatamente o comportamento do optionalAuthMiddleware.js.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user || undefined;
  }
}
