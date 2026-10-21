import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItineraryItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  attractionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  durationHours?: number;
}

export class ItineraryDayDto {
  @ApiProperty()
  @IsNumber()
  dayNumber: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ type: [ItineraryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  items: ItineraryItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  accommodationCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  transportCost?: number;
}

export class CreateItineraryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty()
  @IsNumber()
  totalDays: number;

  @ApiProperty({ type: [ItineraryDayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  days: ItineraryDayDto[];
}
