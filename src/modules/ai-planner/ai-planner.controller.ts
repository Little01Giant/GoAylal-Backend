import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiPlannerService, type AiChatResult } from './ai-planner.service.js';
import { AiChatRequestDto } from './dto/ai-chat-request.dto.js';

@ApiTags('AI Planner')
@Controller('ai')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Post('chat')
  @ApiOperation({ summary: 'DeepSeek AI аяллын зөвлөхтэй чатлах & төлөвлөгөө боловсруулах' })
  @ApiResponse({ status: 200, description: 'AI хариу болон төлөвлөгөөний хураангуй амжилттай буцлаа.' })
  async chat(@Body() dto: AiChatRequestDto): Promise<AiChatResult> {
    return this.aiPlannerService.chat(dto.message, dto.sessionId);
  }
}
