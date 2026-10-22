import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema.js';
import { Counter, CounterSchema } from './schemas/counter.schema.js';
import { PaymentSettings, PaymentSettingsSchema } from './schemas/payment-settings.schema.js';
import { PaymentSettingsService } from './payment-settings.service.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { Itinerary, ItinerarySchema } from '../itineraries/schemas/itinerary.schema.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { ItineraryEmailService } from './itinerary-email.service.js';
import { QPayClient } from './qpay/qpay.client.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Itinerary.name, schema: ItinerarySchema },
      { name: Counter.name, schema: CounterSchema },
      { name: PaymentSettings.name, schema: PaymentSettingsSchema },
    ]),
    AuthModule,
    PricingModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentSettingsService, ItineraryEmailService, QPayClient],
  exports: [PaymentsService, PaymentSettingsService, ItineraryEmailService],
})
export class PaymentsModule {}
