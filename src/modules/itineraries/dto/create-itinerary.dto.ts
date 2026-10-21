import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_COST_MNT, MAX_ITINERARY_DAYS } from '../itineraries.constants.js';

// Hard DTO cap only; the business rule (8 items per day) is enforced in the service.
const MAX_ITEMS_PER_REQUEST_DAY = 100;

export class ItineraryItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  attractionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'MNT ₮' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_COST_MNT)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  durationHours?: number;
}

export class ItineraryDayDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(MAX_ITINERARY_DAYS)
  dayNumber: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  date?: string;

  @ApiProperty({ type: [ItineraryItemDto] })
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS_PER_REQUEST_DAY)
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  items: ItineraryItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_COST_MNT)
  accommodationCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_COST_MNT)
  transportCost?: number;
}

export class CreateItineraryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  destinationKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  endDate?: string;

  @ApiProperty({ minimum: 1, maximum: MAX_ITINERARY_DAYS })
  @IsInt()
  @Min(1)
  @Max(MAX_ITINERARY_DAYS)
  totalDays: number;

  @ApiProperty({
    type: [ItineraryDayDto],
    description:
      'Transitional: the current frontend sends a single day holding every item while totalDays is larger; this is accepted.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ITINERARY_DAYS)
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  days: ItineraryDayDto[];
}
