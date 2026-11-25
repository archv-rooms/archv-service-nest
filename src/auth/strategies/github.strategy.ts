import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') || 'not-configured',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) return false;

    return this.authService.findOrCreateFromProvider({
      email,
      name: profile.displayName || profile.username || email,
      avatar: profile.photos?.[0]?.value,
    });
  }
}
