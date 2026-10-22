import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsMongoId } from 'class-validator';
import { MAX_BULK_SIZE } from '../pricing.constants.js';

export const BULK_PLAN_ACTIONS = ['activate', 'deactivate', 'delete'] as const;
export type BulkPlanAction = (typeof BULK_PLAN_ACTIONS)[number];

export class BulkPricingPlansDto {
  @ApiProperty({ type: [String], description: `Сонгосон төлөвлөгөөний ID-ууд (1–${MAX_BULK_SIZE})` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_SIZE)
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids: string[];

  @ApiProperty({ enum: BULK_PLAN_ACTIONS })
  @IsIn(BULK_PLAN_ACTIONS)
  action: BulkPlanAction;
}
