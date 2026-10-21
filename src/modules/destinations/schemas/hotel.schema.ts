import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HotelDocument = Hotel & Document;

@Schema({ timestamps: true, collection: 'hotels' })
export class Hotel {
  @Prop({ type: Types.ObjectId, ref: 'Destination', required: true, index: true })
  destinationId: Types.ObjectId;

  /** Stable natural id from the seed catalog; makes seeding an idempotent upsert. */
  @Prop({ required: false })
  seedId?: string;

  @Prop({ required: true, index: true })
  destinationKey: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, required: true, min: 1, max: 5, index: true })
  starRating: number;

  @Prop({ type: Number, required: true })
  pricePerNight: number; // in MNT ₮

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  locationDesc: string;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ required: false })
  badge?: string;
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);

HotelSchema.index(
  { destinationKey: 1, seedId: 1 },
  { unique: true, partialFilterExpression: { seedId: { $type: 'string' } } },
);
