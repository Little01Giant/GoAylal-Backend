import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PricingPlanDocument = PricingPlan & Document;

@Schema({ timestamps: true, collection: 'pricing_plans' })
export class PricingPlan {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, trim: true, default: '' })
  description: string;

  /** Base price in MNT before any discount. */
  @Prop({ type: Number, required: true })
  price: number;

  /** Access length in days; 0 means no expiry. */
  @Prop({ type: Number, default: 0 })
  durationDays: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  /** Exactly one active plan is the default; it is charged when the payer does not pick a plan. */
  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PricingPlanSchema = SchemaFactory.createForClass(PricingPlan);

PricingPlanSchema.index({ isDefault: 1 });
PricingPlanSchema.index({ isActive: 1, sortOrder: 1 });
