import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestedTripDto {
  @ApiProperty({ example: 'trip-shanghai' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Шанхай хотын аяллын хөтөлбөр' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Шанхай хот, Хятад' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ example: 'Хятад' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'china', required: false })
  @IsString()
  @IsOptional()
  countryKey?: string;

  @ApiProperty({ example: '🇨🇳', required: false })
  @IsString()
  @IsOptional()
  countryFlag?: string;

  @ApiProperty({ example: '3 – 8 өдөр', required: false })
  @IsString()
  @IsOptional()
  durationText?: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  daysCount: number;

  @ApiProperty({ example: 'popular', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Бэлэн төлөвлөгөө', required: false })
  @IsString()
  @IsOptional()
  categoryLabel?: string;

  @ApiProperty({ example: 1450000 })
  @IsNumber()
  startingPrice: number;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ example: 4.9, required: false })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiProperty({ example: 150, required: false })
  @IsNumber()
  @IsOptional()
  reviewsCount?: number;

  @ApiProperty({ example: ['Дорнын сувд цамхаг', 'Бунд гудамж', 'Диснейлэнд'], required: false })
  @IsArray()
  @IsOptional()
  highlights?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
