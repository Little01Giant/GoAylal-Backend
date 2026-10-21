import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService, type AuthLoginResult } from './auth.service.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { UserDocument } from './schemas/user.schema.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @ApiOperation({
    summary: 'Google дансаар нэвтрэх / Бүртгүүлэх',
    description:
      'Frontend (Next.js)-ээс Google-ийн ID Token-ийг хүлээн авч баталгаажуулан системийн өөрийн JWT Access Token олгоно.',
  })
  @ApiResponse({
    status: 200,
    description: 'Амжилттай нэвтэрч JWT Access Token болон хэрэглэгчийн мэдээлэл буцна.',
  })
  @ApiResponse({ status: 401, description: 'Google ID Token хүчингүй.' })
  async loginWithGoogle(@Body() dto: GoogleAuthDto): Promise<AuthLoginResult> {
    return this.authService.loginWithGoogle(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Нэвтэрсэн хэрэглэгчийн профайлыг авах',
    description: 'Bearer JWT токеноор баталгаажуулан хэрэглэгчийн мэдээллийг буцаана.',
  })
  @ApiResponse({ status: 200, description: 'Хэрэглэгчийн мэдээлэл.' })
  @ApiResponse({ status: 401, description: 'Токен хүчингүй эсвэл дутуу.' })
  async getMe(@Req() req: { user: { sub: string } }): Promise<UserDocument> {
    return this.authService.getProfile(req.user.sub);
  }
}
