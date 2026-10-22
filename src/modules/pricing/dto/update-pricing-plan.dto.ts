import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePricingPlanDto } from './create-pricing-plan.dto.js';

/** The code is the stable identifier and cannot be changed after creation. */
export class UpdatePricingPlanDto extends PartialType(OmitType(CreatePricingPlanDto, ['code'] as const)) {}
