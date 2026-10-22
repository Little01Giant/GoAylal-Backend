import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { MAX_BULK_SIZE, MAX_PLAN_PRICE_MNT } from '../pricing.constants.js';
import { DiscountType } from '../schemas/discount.schema.js';

export const BULK_DISCOUNT_ACTIONS = ['activate', 'deactivate', 'delete', 'update'] as const;
export type BulkDiscountAction = (typeof BULK_DISCOUNT_ACTIONS)[number];

/** `all` applies to every plan; `set` replaces, `add` / `remove` adjust each discount's plan list. */
export const BULK_PLAN_MODES = ['all', 'set', 'add', 'remove'] as const;
export type BulkPlanMode = (typeof BULK_PLAN_MODES)[number];

export class BulkDiscountsDto {
  @ApiProperty({ type: [String], description: `Сонгосон хөнгөлөлтүүдийн ID-ууд (1–${MAX_BULK_SIZE})` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_SIZE)
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids: string[];

  @ApiProperty({ enum: BULK_DISCOUNT_ACTIONS })
  @IsIn(BULK_DISCOUNT_ACTIONS)
  action: BulkDiscountAction;

  @ApiPropertyOptional({ enum: DiscountType, description: '`update` үед: төрлийг шинэчилнэ' })
  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @ApiPropertyOptional({ description: '`update` үед: утгыг шинэчилнэ' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PLAN_PRICE_MNT)
  value?: number;

  @ApiPropertyOptional({ nullable: true, description: '`update` үед: эхлэх огноо (null = цэвэрлэх)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date | null;

  @ApiPropertyOptional({ nullable: true, description: '`update` үед: дуусах огноо (null = цэвэрлэх)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date | null;

  @ApiPropertyOptional({ enum: BULK_PLAN_MODES, description: '`update` үед: төлөвлөгөөний хамрах хүрээг өөрчлөх' })
  @IsOptional()
  @IsIn(BULK_PLAN_MODES)
  planMode?: BulkPlanMode;

  @ApiPropertyOptional({ type: [String], description: '`planMode` set/add/remove үед шаардлагатай' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BULK_SIZE)
  @ArrayUnique()
  @IsMongoId({ each: true })
  planIds?: string[];
}
