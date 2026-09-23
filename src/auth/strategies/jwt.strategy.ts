import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  id: number;
  role: string;
  sessionToken: string;
}

// O Passport já cuida de: extrair o "Bearer <token>" do header Authorization,
// verificar a assinatura e a expiração do JWT. Se algo disso falhar, ele
// rejeita a requisição antes mesmo de chegar no método validate() abaixo.
// O que sobra pra gente fazer aqui é exatamente o que o authMiddleware.js
// fazia depois do jwt.verify: buscar o usuário e checar sessionToken/banimento.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, sessionToken: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (user.role === 'banned') {
      throw new ForbiddenException('ACCOUNT_BANNED');
    }

    if (!payload.sessionToken || payload.sessionToken !== user.sessionToken) {
      throw new UnauthorizedException('SESSION_CONFLICT');
    }

    // O que a gente retorna aqui vira "req.user" no controller — equivalente
    // ao req.userId / req.userRole / req.user que o authMiddleware.js setava.
    return { id: user.id, role: user.role };
  }
}
