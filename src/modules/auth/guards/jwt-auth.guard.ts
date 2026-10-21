import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Нэвтрэх токен дутуу эсвэл буруу байна (Bearer token required)');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret =
        this.configService.get<string>('jwt.secret') ??
        'goaylal_jwt_super_secret_key_2026';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Токен хүчингүй эсвэл хугацаа нь дууссан байна');
    }
  }
}
