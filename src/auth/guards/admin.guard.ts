import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

// No Express, adminMiddleware chamava authMiddleware por dentro e só depois
// checava a role. Aqui fazemos o mesmo em duas etapas: primeiro reaproveita
// o JwtAuthGuard (garante que req.user existe), depois confere a role.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await this.jwtAuthGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('Acesso negado. Apenas administradores.');
    }

    return true;
  }
}
