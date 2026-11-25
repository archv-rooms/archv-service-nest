import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { readAppUrlFromState, withParams } from './oauth-app-url';

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: any, @Res() res: Response) {
    this.finishLogin(req, res, 'google');
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  githubCallback(@Req() req: any, @Res() res: Response) {
    this.finishLogin(req, res, 'github');
  }

  private finishLogin(req: any, res: Response, provider: string) {
    const appUrl = readAppUrlFromState(req.query.state);
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const user = req.user;

    if (!user) {
      if (appUrl) return res.redirect(withParams(appUrl, `error=${provider}`));
      return res.redirect(`${frontendUrl}/auth/login?error=${provider}`);
    }

    const token = this.authService.signToken(user.id, user.role, user.sessionToken);
    const needsUsername = !user.username;
    const params = `token=${token}&name=${encodeURIComponent(user.name)}&role=${user.role}&needsUsername=${needsUsername}`;

    if (appUrl) return res.redirect(withParams(appUrl, params));

    res.redirect(`${frontendUrl}/auth/google/callback?${params}`);
  }
}
