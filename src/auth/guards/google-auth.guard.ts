import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { buildOAuthOptions } from '../oauth-app-url';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return buildOAuthOptions(request.query.app, { prompt: 'select_account' });
  }

  handleRequest(err: unknown, user: any) {
    return user || null;
  }
}
