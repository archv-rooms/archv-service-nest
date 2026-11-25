import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { buildOAuthOptions } from '../oauth-app-url';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return buildOAuthOptions(request.query.app, { scope: ['user:email'] });
  }

  handleRequest(err: unknown, user: any) {
    return user || null;
  }
}
