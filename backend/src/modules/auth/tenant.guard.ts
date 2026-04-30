import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;
    const query = request.query;

    // Se o usuário não estiver autenticado (não deveria acontecer se usado após JwtAuthGuard)
    if (!user || !user.economicGroupId) {
      return true; // Deixa o JwtGuard/RolesGuard lidar com isso
    }

    // Se houver um economicGroupId no body ou query, deve bater com o do usuário
    const targetGroupId = body.economicGroupId || query.economicGroupId;

    if (targetGroupId && targetGroupId !== user.economicGroupId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar dados de outro grupo econômico.',
      );
    }

    return true;
  }
}
