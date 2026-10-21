import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import type { AuthenticatedRequest } from '../auth.types.js';
import { extractBearerToken } from './bearer-token.js';

/** Requires a valid bearer token for an active user. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Нэвтрэх токен дутуу эсвэл буруу байна (Bearer token required)');
    }
    request.user = await this.authService.authenticateToken(token);
    return true;
  }
}

/** Lets anonymous requests through, but rejects a token that is present and invalid. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (token) {
      request.user = await this.authService.authenticateToken(token);
    }
    return true;
  }
}
