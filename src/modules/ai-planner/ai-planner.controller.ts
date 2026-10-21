import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiPlannerService, type AiChatResult } from './ai-planner.service.js';
import { AiChatRequestDto } from './dto/ai-chat-request.dto.js';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@ApiTags('AI Planner')
@Controller('ai')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Post('chat')
  @HttpCode(200)
  @UseGuards(OptionalJwtAuthGuard, RateLimitGuard)
  @RateLimit(20)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'AI аяллын зөвлөхтэй чатлах & төлөвлөгөө боловсруулах',
    description:
      'Нэвтэрсэн хэрэглэгчийн яриа хэрэглэгчид холбогдоно; өөр хэрэглэгчийн sessionId-г ашиглавал шинэ яриа эхэлнэ. Мессеж ≤ 1000 тэмдэгт, минутанд 20 хүсэлт.',
  })
  @ApiResponse({ status: 200, description: 'AI хариу болон төлөвлөгөөний хураангуй амжилттай буцлаа.' })
  async chat(
    @Body() dto: AiChatRequestDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<AiChatResult> {
    return this.aiPlannerService.chat(dto.message, dto.sessionId ?? dto.conversationId, user?.sub);
  }
}
