import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, type AuthLoginResult, type ProfileDto } from './auth.service.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import type { AuthenticatedUser } from './auth.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(200)
  @UseGuards(RateLimitGuard)
  @RateLimit(20)
  @ApiOperation({
    summary: 'Google дансаар нэвтрэх / Бүртгүүлэх',
    description:
      'Frontend (Next.js)-ээс Google-ийн ID Token-ийг хүлээн авч баталгаажуулан системийн өөрийн JWT Access Token олгоно. Хэрэглэгчийн нэр, зураг нь зөвхөн Google токеноос авагдана.',
  })
  @ApiResponse({ status: 200, description: 'Амжилттай нэвтэрч JWT Access Token болон хэрэглэгчийн мэдээлэл буцна.' })
  @ApiResponse({ status: 401, description: 'Google ID Token хүчингүй.' })
  async loginWithGoogle(@Body() dto: GoogleAuthDto): Promise<AuthLoginResult> {
    return this.authService.loginWithGoogle(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Нэвтэрсэн хэрэглэгчийн профайлыг авах' })
  @ApiResponse({ status: 200, description: 'Хэрэглэгчийн мэдээлэл.' })
  @ApiResponse({ status: 401, description: 'Токен хүчингүй эсвэл дутуу.' })
  async getMe(@CurrentUser() user: AuthenticatedUser | undefined): Promise<ProfileDto> {
    return this.authService.getProfile(user?.sub ?? '');
  }
}
