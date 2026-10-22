import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { DiscountType } from './discount-type.js';

export { DiscountType };

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true, collection: 'discounts' })
export class Discount {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, enum: DiscountType })
  type: DiscountType;

  /** Percent (1-90) for `percentage`, MNT for `fixed`. */
  @Prop({ type: Number, required: true })
  value: number;

  @Prop({ type: Date, required: false })
  startsAt?: Date;

  @Prop({ type: Date, required: false })
  endsAt?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  /** True: applies to every plan. False: only to `planIds` (an empty list applies to nothing). */
  @Prop({ type: Boolean, default: false })
  appliesToAll: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'PricingPlan', default: [] })
  planIds: Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

DiscountSchema.index({ isActive: 1, appliesToAll: 1 });
DiscountSchema.index({ planIds: 1 });
