import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ItinerariesService } from './itineraries.service.js';
import { CreateItineraryDto } from './dto/create-itinerary.dto.js';
import type { Itinerary, ItineraryDocument } from './schemas/itinerary.schema.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Itineraries')
@Controller('itineraries')
export class ItinerariesController {
  constructor(
    private readonly itinerariesService: ItinerariesService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Шинэ аяллын хөтөлбөр үүсгэх' })
  @ApiResponse({ status: 201, description: 'Аяллын хөтөлбөр амжилттай үүслээ.' })
  async createItinerary(
    @Body() dto: CreateItineraryDto,
    @Req() req: { headers: { authorization?: string } },
  ): Promise<ItineraryDocument> {
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const payload = this.jwtService.decode(token) as { sub?: string } | null;
          if (payload?.sub) {
            userId = payload.sub;
          }
        } catch {
          // Guest/unauthenticated fallback
        }
      }
    }
    return this.itinerariesService.create(dto, userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Хэрэглэгчийн хадгалсан аяллууд' })
  @ApiResponse({ status: 200, description: 'Хэрэглэгчийн аяллуудын жагсаалт.' })
  async getMyItineraries(@Req() req: { user: { sub: string } }): Promise<Itinerary[]> {
    return this.itinerariesService.findUserItineraries(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Аяллын хөтөлбөрийг ID-аар авах' })
  @ApiParam({ name: 'id', description: 'Хөтөлбөрийн ObjectId' })
  @ApiResponse({ status: 200, description: 'Хөтөлбөрийн дэлгэрэнгүй өгөгдөл.' })
  @ApiResponse({ status: 404, description: 'Аяллын хөтөлбөр олдсонгүй.' })
  async getItinerary(@Param('id') id: string): Promise<Itinerary> {
    return this.itinerariesService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Аяллын хөтөлбөр устгах' })
  @ApiParam({ name: 'id', description: 'Хөтөлбөрийн ObjectId' })
  @ApiResponse({ status: 200, description: 'Аяллын хөтөлбөр амжилттай устгагдлаа.' })
  async deleteItinerary(@Param('id') id: string): Promise<{ deleted: boolean; id: string }> {
    return this.itinerariesService.delete(id);
  }

  @Put(':id/reorder-items')
  @ApiOperation({ summary: 'Drag-and-Drop дараалал өөрчлөх' })
  @ApiParam({ name: 'id', description: 'Хөтөлбөрийн ObjectId' })
  @ApiResponse({ status: 200, description: 'Дараалал шинэчлэгдсэн үр дүн.' })
  async reorderItems(
    @Param('id') id: string,
    @Body()
    body: {
      sourceDayNumber: number;
      destinationDayNumber: number;
      itemId: string;
      newOrderIndex: number;
    },
  ): Promise<{ updated: boolean; totalCost: number }> {
    return this.itinerariesService.reorderItems(
      id,
      body.sourceDayNumber,
      body.destinationDayNumber,
      body.itemId,
      body.newOrderIndex,
    );
  }
}
