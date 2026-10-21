import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role?: string;
  readonly name?: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly superAdminEmail = 'munkhuu.munkhsaihan01@gmail.com';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Нэвтрэх токен шаардлагатай (Bearer token missing).');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Токен тодорхойгүй байна.');
    }

    // Dev mode token support for local testing
    const isDev = (this.configService.get<string>('nodeEnv') ?? process.env.NODE_ENV) !== 'production';
    if (isDev && token === 'dev-admin-token') {
      request.user = {
        sub: 'dev-admin',
        email: this.superAdminEmail,
        role: 'admin',
        name: 'Мөнх-Эрдэнэ (Админ)',
      };
      return true;
    }

    try {
      const secret =
        this.configService.get<string>('jwt.secret') ??
        'goaylal_jwt_super_secret_key_2026';
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      request.user = payload;

      const isAdmin =
        payload.role === 'admin' ||
        payload.email.toLowerCase() === this.superAdminEmail.toLowerCase();

      if (!isAdmin) {
        throw new ForbiddenException('Зөвхөн админ хэрэглэгч энэ үйлдлийг хийх эрхтэй.');
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Токен хүчингүй эсвэл хугацаа нь дууссан байна.');
    }
  }
}
