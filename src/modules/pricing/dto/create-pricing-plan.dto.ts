import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_PLAN_DURATION_DAYS,
  MAX_PLAN_FEATURES,
  MAX_PLAN_PRICE_MNT,
  MIN_PLAN_PRICE_MNT,
} from '../pricing.constants.js';

export class CreatePricingPlanDto {
  @ApiProperty({ example: 'standard', description: 'Өвөрмөц код (үүссэний дараа өөрчлөгдөхгүй)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Код зөвхөн жижиг латин үсэг, тоо, зураас агуулна.' })
  code: string;

  @ApiProperty({ example: 'Төлөвлөгөө нээх' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Зардлын задаргаа болон PDF хөтөлбөр' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 20000, description: 'Үндсэн үнэ (₮)' })
  @IsInt({ message: 'Үнэ бүхэл тоо байх ёстой.' })
  @Min(MIN_PLAN_PRICE_MNT, { message: `Үнэ хамгийн багадаа ${MIN_PLAN_PRICE_MNT}₮ байна.` })
  @Max(MAX_PLAN_PRICE_MNT)
  price: number;

  @ApiPropertyOptional({ example: 0, description: 'Хүчинтэй хоног (0 = хугацаагүй)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PLAN_DURATION_DAYS)
  durationDays?: number;

  @ApiPropertyOptional({ example: ['Зардлын бүрэн задаргаа', 'PDF хөтөлбөр'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PLAN_FEATURES)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Төлөвлөгөө сонгоогүй үед ашиглагдах үндсэн төлөвлөгөө' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}
