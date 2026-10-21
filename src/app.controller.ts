import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Системийн ажиллагааны төлөв шалгах (Health check)' })
  getHealth(): { status: string; timestamp: string; service: string } {
    return this.appService.getHealth();
  }
}
