import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransportDocument = Transport & Document;

export enum TransportType {
  FLIGHT = 'flight',
  OVERLAND = 'overland',
  COMBINED = 'combined',
}

@Schema({ timestamps: true, collection: 'transports' })
export class Transport {
  @Prop({ type: Types.ObjectId, ref: 'Destination', required: true, index: true })
  destinationId: Types.ObjectId;

  /** Stable natural id from the seed catalog; makes seeding an idempotent upsert. */
  @Prop({ required: false })
  seedId?: string;

  @Prop({ required: true, index: true })
  destinationKey: string;

  @Prop({ required: true, enum: TransportType })
  type: TransportType; // flight | overland | combined

  @Prop({ required: true })
  title: string; // "Дан нислэг", "Газраар", "Газар & нислэг хосолсон"

  @Prop({ required: true })
  durationText: string; // Туулах хугацаа (жишээ: "2 цаг 10 мин", "24-28 цаг")

  @Prop({ type: Number, required: true })
  pricePerPerson: number; // 1 хүний зардал (MNT ₮)

  @Prop({ required: false })
  description?: string; // Хэрхэн явах тухай товч тайлбар

  @Prop({ required: false })
  badge?: string; // Жишээ нь: "Шуурхай", "Хэмнэлттэй", "Тэнцвэртэй"

  @Prop({ required: false })
  provider?: string;

  @Prop({ required: false })
  departureFrom?: string;

  @Prop({ required: false })
  arrivalAt?: string;

  @Prop({ type: [String], default: [] })
  features?: string[];

  /** Trip.com page the price came from (internal, for price refreshes). */
  @Prop({ required: false })
  sourceUrl?: string;

  /** YYYY-MM-DD the price was last checked. */
  @Prop({ required: false })
  priceCheckedAt?: string;
}

export const TransportSchema = SchemaFactory.createForClass(Transport);

TransportSchema.index(
  { destinationKey: 1, seedId: 1 },
  { unique: true, partialFilterExpression: { seedId: { $type: 'string' } } },
);
