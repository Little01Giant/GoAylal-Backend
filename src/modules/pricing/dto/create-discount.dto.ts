import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_BULK_SIZE, MAX_PLAN_PRICE_MNT } from '../pricing.constants.js';
import { DiscountType } from '../schemas/discount.schema.js';

export class CreateDiscountDto {
  @ApiProperty({ example: 'Намрын хямдрал' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 10, description: 'Хувь (1–90) эсвэл тогтмол дүн (₮)' })
  @IsInt({ message: 'Хөнгөлөлтийн утга бүхэл тоо байх ёстой.' })
  @Min(1, { message: 'Хөнгөлөлтийн утга 1-ээс их байх ёстой.' })
  @Max(MAX_PLAN_PRICE_MNT)
  value: number;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-11-30T23:59:59.000Z', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Бүх төлөвлөгөөнд үйлчилнэ' })
  @IsOptional()
  @IsBoolean()
  appliesToAll?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Үйлчлэх төлөвлөгөөний ID-ууд (appliesToAll=false үед)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BULK_SIZE)
  @IsMongoId({ each: true })
  planIds?: string[];
}
