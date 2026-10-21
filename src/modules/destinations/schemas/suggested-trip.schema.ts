import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SuggestedTripDocument = SuggestedTrip & Document;

@Schema({ timestamps: true, collection: 'suggested_trips' })
export class SuggestedTrip {
  @Prop({ required: true, unique: true, index: true })
  slug: string; // e.g. 'trip-beijing', 'trip-shanghai'

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  destination: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true, default: 'china' })
  countryKey: string;

  @Prop({ required: true, default: '🇨🇳' })
  countryFlag: string;

  @Prop({ required: true, default: '3 – 10 өдөр' })
  durationText: string;

  @Prop({ required: true, default: 5 })
  daysCount: number;

  @Prop({ default: 'popular' })
  category: string;

  @Prop({ default: 'Бэлэн төлөвлөгөө' })
  categoryLabel: string;

  @Prop({ required: true, default: 1348250 })
  startingPrice: number;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: 4.9 })
  rating: number;

  @Prop({ default: 184 })
  reviewsCount: number;

  @Prop({ type: [String], default: [] })
  highlights: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const SuggestedTripSchema = SchemaFactory.createForClass(SuggestedTrip);
