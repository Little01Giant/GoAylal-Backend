import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schemas/user.schema.js';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../payments/schemas/payment-transaction.schema.js';
import {
  SuggestedTrip,
  SuggestedTripSchema,
} from '../destinations/schemas/suggested-trip.schema.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './guards/admin.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: SuggestedTrip.name, schema: SuggestedTripSchema },
    ]),
    PaymentsModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
