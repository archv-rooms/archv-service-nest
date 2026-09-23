import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// AuthGuard('jwt') dispara a JwtStrategy registrada no AuthModule.
// Usar assim: @UseGuards(JwtAuthGuard) em cima de um controller ou de uma
// rota específica — igual a colocar authMiddleware antes da rota no Express.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
