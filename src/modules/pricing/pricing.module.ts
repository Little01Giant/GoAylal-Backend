import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminGuard } from '../admin/guards/admin.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { PricingController } from './pricing.controller.js';
import { PricingService } from './pricing.service.js';
import { Discount, DiscountSchema } from './schemas/discount.schema.js';
import { PricingPlan, PricingPlanSchema } from './schemas/pricing-plan.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricingPlan.name, schema: PricingPlanSchema },
      { name: Discount.name, schema: DiscountSchema },
    ]),
    AuthModule,
  ],
  controllers: [PricingController],
  providers: [PricingService, AdminGuard],
  exports: [PricingService],
})
export class PricingModule {}
