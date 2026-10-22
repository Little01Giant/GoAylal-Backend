import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentTransactionDocument = PaymentTransaction & Document;

export enum PaymentMethod {
  QPAY = 'qpay',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

/** The only values the API ever emits. `refunded` is reserved for manual support action. */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export const PENDING_DEDUPE_INDEX = 'uniq_pending_dedupe_key';

@Schema({ _id: false })
export class ReceiptItem {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;
}
export const ReceiptItemSchema = SchemaFactory.createForClass(ReceiptItem);

@Schema({ timestamps: true, collection: 'payment_transactions' })
export class PaymentTransaction {
  @Prop({ required: true, unique: true })
  transactionNumber: string; // TRX-2026-1021-0001

  @Prop({ required: true, unique: true })
  invoiceNumber: string; // INV-2026-1021-0001

  @Prop({ type: Types.ObjectId, ref: 'Itinerary', required: false })
  itineraryId?: Types.ObjectId;

  /** Absent for guest checkout until the payer signs in with the same verified email. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number; // in MNT ₮: the server-side plan price after discounts

  /** Pricing breakdown captured at invoice time; later plan or discount edits never rewrite history. */
  @Prop({ type: Types.ObjectId, ref: 'PricingPlan', required: false })
  planId?: Types.ObjectId;

  @Prop({ required: false })
  planName?: string;

  @Prop({ type: Number, required: false })
  planDurationDays?: number;

  @Prop({ type: Number, required: false })
  baseAmount?: number;

  @Prop({ type: Number, required: false })
  discountAmount?: number;

  @Prop({ type: Types.ObjectId, ref: 'Discount', required: false })
  discountId?: Types.ObjectId;

  @Prop({ required: false })
  discountName?: string;

  @Prop({ default: 'MNT' })
  currency: string;

  @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.QPAY })
  method: PaymentMethod;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  /** One pending invoice per payer+plan; enforced by a partial unique index. */
  @Prop({ required: false, select: false })
  dedupeKey?: string;

  @Prop({ required: false })
  qpayInvoiceId?: string;

  /** When QPay was last asked about this invoice by the status poll; spaces those checks out. */
  @Prop({ type: Date, required: false })
  lastQpayCheckAt?: Date;

  @Prop({ required: false })
  qpayQrText?: string;

  @Prop({ required: false })
  qpayQrImage?: string;

  @Prop({ required: false })
  qpayShortUrl?: string;

  @Prop({ type: Array, default: [] })
  qpayUrls?: Array<{
    name: string;
    description: string;
    logo: string;
    link: string;
  }>;

  @Prop({ required: false })
  bankName?: string;

  @Prop({ required: false })
  paidAt?: Date;

  @Prop({ type: [ReceiptItemSchema], default: [] })
  items: ReceiptItem[];

  @Prop({ required: false, lowercase: true, trim: true })
  customerEmail?: string;

  /** Immutable after creation; client-supplied display data, never used for pricing. */
  @Prop({ type: Object, required: false })
  planSnapshot?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);

PaymentTransactionSchema.index({ userId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ customerEmail: 1, createdAt: -1 });
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });
PaymentTransactionSchema.index({ qpayInvoiceId: 1 });
PaymentTransactionSchema.index(
  { dedupeKey: 1 },
  {
    name: PENDING_DEDUPE_INDEX,
    unique: true,
    partialFilterExpression: { status: PaymentStatus.PENDING, dedupeKey: { $exists: true } },
  },
);
