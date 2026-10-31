import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestedTripDto {
  @ApiProperty({ example: 'trip-shanghai' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug зөвхөн жижиг латин үсэг, тоо, зураас агуулна' })
  slug: string;

  @ApiProperty({ example: 'Шанхай хотын аяллын төлөвлөгөө' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Шанхай хот, Хятад' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  destination: string;

  @ApiProperty({ example: 'Хятад' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: 'china', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  countryKey?: string;

  @ApiProperty({ example: '🇨🇳', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  countryFlag?: string;

  @ApiProperty({ example: '3 – 8 өдөр', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  durationText?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(30)
  daysCount: number;

  @ApiProperty({ example: 'popular', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  category?: string;

  @ApiProperty({ example: 'Бэлэн төлөвлөгөө', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  categoryLabel?: string;

  @ApiProperty({ example: 1450000 })
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  startingPrice: number;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  imageUrl: string;

  @ApiProperty({ example: 4.9, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 150, required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10_000_000)
  reviewsCount?: number;

  @ApiProperty({ example: ['Дорнын сувд цамхаг', 'Бунд гудамж', 'Диснейлэнд'], required: false })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  highlights?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
