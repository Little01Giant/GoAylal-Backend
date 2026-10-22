import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentSettingsDocument = PaymentSettings & Document<string>;

export const PAYMENT_SETTINGS_ID = 'payment';

/**
 * Dashboard overrides for payment behaviour. A missing field means "use the environment value",
 * so a deployment that never touches the dashboard behaves exactly as configured in `.env`.
 */
@Schema({ collection: 'payment_settings', versionKey: false, timestamps: true })
export class PaymentSettings {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Boolean, required: false })
  guestCheckoutEnabled?: boolean;

  @Prop({ type: Boolean, required: false })
  emailEnabled?: boolean;

  updatedAt?: Date;
}

export const PaymentSettingsSchema = SchemaFactory.createForClass(PaymentSettings);
