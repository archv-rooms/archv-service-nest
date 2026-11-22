import { Controller, Post, Get, Body, Query, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

// Prefixo /api/auth — mesmo caminho que o server.js registrava com
// app.use('/api/auth', authRoutes).
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      success: true,
      data: { user },
      message: 'Usuário registrado. Verifique seu e-mail para ativar a conta.',
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
      message: 'Login realizado com sucesso.',
    };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      success: true,
      data: {},
      message: 'E-mail de redefinição enviado com sucesso.',
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return {
      success: true,
      data: {},
      message: 'Senha redefinida com sucesso.',
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      success: true,
      data: {},
      message: 'E-mail verificado com sucesso.',
    };
  }
}

// Rotas do Google OAuth ficam num controller à parte porque no projeto
// Express elas moravam fora do prefixo /api (app.use('/auth', googleAuthRoutes),
// sem o "/api" na frente). Mantemos esse mesmo caminho aqui.
@Controller('auth')
export class GoogleAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // O guard já redireciona para a tela de login do Google.
    // Esse método nunca chega a executar.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.signToken(user.id, user.role, user.sessionToken);
    const needsUsername = !user.username;
    const frontendUrl = this.config.get('FRONTEND_URL');

    res.redirect(
      `${frontendUrl}/auth/google/callback?token=${token}&name=${encodeURIComponent(user.name)}&role=${user.role}&needsUsername=${needsUsername}`,
    );
  }
}
