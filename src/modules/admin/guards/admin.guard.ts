import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthenticatedRequest } from '../../auth/auth.types.js';
import { UserRole } from '../../auth/schemas/user.schema.js';
import { extractBearerToken } from '../../auth/guards/bearer-token.js';

const DEV_ADMIN_TOKEN = 'dev-admin-token';

/**
 * Requires an authenticated admin. The role is read from the database. The `dev-admin-token`
 * shortcut exists only when ALLOW_DEV_ADMIN_TOKEN=true outside production.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Нэвтрэх токен шаардлагатай (Bearer token missing).');
    }

    if (token === DEV_ADMIN_TOKEN && this.configService.get<boolean>('admin.devToken') === true) {
      request.user = { sub: 'dev-admin', email: 'dev-admin@localhost', role: UserRole.ADMIN, name: 'Dev Admin' };
      return true;
    }

    const user = await this.authService.authenticateToken(token);
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Зөвхөн админ хэрэглэгч энэ үйлдлийг хийх эрхтэй.');
    }
    request.user = user;
    return true;
  }
}
