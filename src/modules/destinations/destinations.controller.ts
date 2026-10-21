import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DestinationsService, type SuggestedTripItem } from './destinations.service.js';
import type { Destination } from './schemas/destination.schema.js';
import type { SeedDestinationCity } from './all-destinations.data.js';

@ApiTags('Destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Get()
  @ApiOperation({ summary: 'Бүх аяллын чиглэлүүдийн жагсаалт авах' })
  @ApiQuery({ name: 'countryKey', required: false, description: 'Улсын түлхүүр үг (жишээ: china)' })
  @ApiQuery({ name: 'popular', required: false, description: 'Онцлох чиглэлээр шүүх' })
  @ApiResponse({ status: 200, description: 'Аяллын чиглэлүүдийн жагсаалт амжилттай буцлаа.' })
  async getDestinations(
    @Query('countryKey') countryKey?: string,
    @Query('popular') popular?: string,
  ): Promise<Destination[] | SeedDestinationCity[]> {
    const isPopular = popular !== undefined ? popular === 'true' : undefined;
    return this.destinationsService.findAll({ countryKey, popular: isPopular });
  }

  @Get('suggested-trips')
  @ApiOperation({ summary: 'Бэлэн аяллын хөтөлбөрүүдийн жагсаалт авах' })
  @ApiResponse({ status: 200, description: 'Бэлэн аяллуудын жагсаалт амжилттай буцлаа.' })
  async getSuggestedTrips(): Promise<SuggestedTripItem[]> {
    return this.destinationsService.getSuggestedTrips();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Нэг хотын бүрэн өгөгдөл (үзвэр, буудал, тээвэр) авах' })
  @ApiParam({ name: 'key', description: 'Хотын түлхүүр код (жишээ: beijing)' })
  @ApiResponse({ status: 200, description: 'Хотын дэлгэрэнгүй өгөгдөл амжилттай буцлаа.' })
  @ApiResponse({ status: 404, description: 'Аяллын чиглэл олдсонгүй.' })
  async getDestinationByKey(@Param('key') key: string): Promise<SeedDestinationCity> {
    return this.destinationsService.findByKey(key);
  }
}
