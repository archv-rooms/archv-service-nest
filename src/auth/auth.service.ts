import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const emailInUse = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailInUse) {
      throw new BadRequestException('E-mail já cadastrado.');
    }

    const usernameInUse = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (usernameInUse) {
      throw new BadRequestException('Username já em uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        emailVerified: false,
        emailVerifyToken,
        onboardingDone: false,
      },
    });

    const verifyLink = `${this.config.get('FRONTEND_URL')}/verify-email?token=${emailVerifyToken}`;
    await this.emailService.sendVerificationEmail(dto.email, verifyLink);
    await this.emailService.sendWelcomeEmail(dto.email, dto.name);

    return this.stripPassword(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('E-mail não verificado. Verifique sua caixa de entrada.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutos = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      throw new HttpException(
        `Conta bloqueada. Tente novamente em ${minutos} minuto(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);

    if (!isValidPassword) {
      const novasTentativas = user.loginAttempts + 1;
      const bloqueado = novasTentativas >= MAX_LOGIN_ATTEMPTS;

      await this.prisma.user.update({
        where: { email: dto.email },
        data: {
          loginAttempts: novasTentativas,
          lockedUntil: bloqueado
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null,
        },
      });

      if (bloqueado) {
        throw new HttpException(
          `Muitas tentativas. Conta bloqueada por ${LOCK_MINUTES} minutos.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException(
        `Senha inválida. ${MAX_LOGIN_ATTEMPTS - novasTentativas} tentativa(s) restante(s).`,
      );
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        sessionToken,
      },
    });

    const token = this.signToken(user.id, user.role, sessionToken);

    return { user: this.stripPassword(user), token };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const resetLink = `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordResetEmail(email, resetLink);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        sessionToken: null,
      },
    });
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token é obrigatório.');
    }

    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token inválido.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });
  }

  async findOrCreateFromGoogle(profile: { email: string; name: string; avatar?: string }) {
    const sessionToken = crypto.randomBytes(32).toString('hex');

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          password: '',
          avatar: profile.avatar,
          emailVerified: true,
          onboardingDone: false,
          role: 'user',
          sessionToken,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { email: profile.email },
        data: { sessionToken },
      });
    }

    return user;
  }

  signToken(userId: number, role: string, sessionToken: string) {
    return this.jwtService.sign({ id: userId, role, sessionToken });
  }

  private stripPassword<T extends { password?: string }>(user: T) {
    const { password, ...rest } = user;
    return rest;
  }
}
