import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentTransactionDocument = PaymentTransaction & Document;

export enum PaymentMethod {
  QPAY = 'qpay',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

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
  @Prop({ required: true, unique: true, index: true })
  transactionNumber: string; // TRX-2026-XXXX

  @Prop({ required: true, unique: true, index: true })
  invoiceNumber: string; // INV-2026-XXXX

  @Prop({ type: Types.ObjectId, ref: 'Itinerary', required: false })
  itineraryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number; // in MNT ₮

  @Prop({ default: 'MNT' })
  currency: string;

  @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.QPAY })
  method: PaymentMethod;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING, index: true })
  status: PaymentStatus;

  @Prop({ required: false, index: true })
  qpayInvoiceId?: string;

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

  @Prop({ required: false })
  customerEmail?: string;

  @Prop({ type: Object, required: false })
  planSnapshot?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);
