import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ItinerariesService, type ItineraryDto } from './itineraries.service.js';
import { CreateItineraryDto } from './dto/create-itinerary.dto.js';
import { ReorderItemsDto } from './dto/reorder-items.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { requireUser } from '../../common/utils/require-user.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@ApiTags('Itineraries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post()
  @ApiOperation({ summary: 'Аяллын хөтөлбөрийг эзэмшигчид хадгалах (нэвтрэх шаардлагатай)' })
  @ApiResponse({ status: 201, description: 'Аяллын хөтөлбөр амжилттай хадгалагдлаа.' })
  @ApiResponse({ status: 401, description: 'Нэвтрээгүй: нэвтэрсний дараа хадгална.' })
  async createItinerary(
    @Body() dto: CreateItineraryDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<ItineraryDto> {
    return this.itinerariesService.create(dto, requireUser(user));
  }

  @Get('my')
  @ApiOperation({ summary: 'Хэрэглэгчийн хадгалсан аяллууд' })
  @ApiResponse({ status: 200, description: 'Хэрэглэгчийн аяллуудын жагсаалт.' })
  async getMyItineraries(@CurrentUser() user: AuthenticatedUser | undefined): Promise<ItineraryDto[]> {
    return this.itinerariesService.findUserItineraries(requireUser(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Аяллын хөтөлбөрийг ID-аар авах (эзэмшигч / админ)' })
  @ApiParam({ name: 'id', description: 'Хөтөлбөрийн ObjectId' })
  @ApiResponse({ status: 200, description: 'Хөтөлбөрийн дэлгэрэнгүй өгөгдөл.' })
  @ApiResponse({ status: 404, description: 'Аяллын хөтөлбөр олдсонгүй.' })
  async getItinerary(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<ItineraryDto> {
    return this.itinerariesService.findById(id, requireUser(user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Аяллын хөтөлбөр устгах (эзэмшигч)' })
  @ApiParam({ name: 'id', description: 'Хөтөлбөрийн ObjectId' })
  @ApiResponse({ status: 200, description: 'Аяллын хөтөлбөр амжилттай устгагдлаа.' })
  async deleteItinerary(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.itinerariesService.delete(id, requireUser(user));
  }

  @Put(':id/reorder-items')
  @ApiOperation({ summary: 'Drag-and-Drop дараалал өөрчлөх (эзэмшигч, төлбөр төлөгдөөгүй хөтөлбөр)' })
  @ApiParam({ name: 'id', description: 'Хөтөлбөрийн ObjectId' })
  @ApiResponse({ status: 200, description: 'Дараалал шинэчлэгдсэн үр дүн.' })
  async reorderItems(
    @Param('id') id: string,
    @Body() dto: ReorderItemsDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<{ updated: boolean; totalCost: number; recalculatedTotalCost: number }> {
    return this.itinerariesService.reorderItems(id, dto, requireUser(user));
  }
}
