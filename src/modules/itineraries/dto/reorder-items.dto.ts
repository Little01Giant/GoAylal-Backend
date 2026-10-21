import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_ITINERARY_DAYS } from '../itineraries.constants.js';

export class ReorderItemsDto {
  @ApiProperty({ minimum: 1, maximum: MAX_ITINERARY_DAYS })
  @IsInt()
  @Min(1)
  @Max(MAX_ITINERARY_DAYS)
  sourceDayNumber: number;

  @ApiProperty({ minimum: 1, maximum: MAX_ITINERARY_DAYS })
  @IsInt()
  @Min(1)
  @Max(MAX_ITINERARY_DAYS)
  destinationDayNumber: number;

  @ApiProperty({ description: 'Item _id (or its attractionId when unambiguous)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  itemId: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(1000)
  newOrderIndex: number;
}
