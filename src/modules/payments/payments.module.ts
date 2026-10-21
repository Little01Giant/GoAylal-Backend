import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema.js';
import { Itinerary, ItinerarySchema } from '../itineraries/schemas/itinerary.schema.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { ItineraryEmailService } from './itinerary-email.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Itinerary.name, schema: ItinerarySchema },
    ]),
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ItineraryEmailService],
  exports: [PaymentsService, ItineraryEmailService],
})
export class PaymentsModule {}
