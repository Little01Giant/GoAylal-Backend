import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItineraryDocument = Itinerary & Document;

export enum ItineraryStatus {
  DRAFT = 'draft',
  SAVED = 'saved',
  BOOKED = 'booked',
  COMPLETED = 'completed',
}

@Schema({ _id: true })
export class ItineraryItemSubdoc {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  attractionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  orderIndex: number;

  @Prop({ type: Number, default: 0 })
  cost: number; // in MNT ₮

  @Prop({ type: Number, default: 2.0 })
  durationHours: number;

  @Prop({ required: false })
  notes?: string;
}
export const ItineraryItemSchema = SchemaFactory.createForClass(ItineraryItemSubdoc);

@Schema({ _id: true })
export class ItineraryDaySubdoc {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  dayNumber: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  date?: string;

  @Prop({ type: [ItineraryItemSchema], default: [] })
  items: ItineraryItemSubdoc[];

  @Prop({ type: Number, default: 0 })
  accommodationCost: number;

  @Prop({ type: Number, default: 0 })
  transportCost: number;

  @Prop({ required: false })
  notes?: string;
}
export const ItineraryDaySchema = SchemaFactory.createForClass(ItineraryDaySubdoc);

@Schema({ timestamps: true, collection: 'itineraries' })
export class Itinerary {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  destinationKey: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  startDate?: string;

  @Prop({ required: false })
  endDate?: string;

  @Prop({ type: Number, default: 1 })
  totalDays: number;

  @Prop({ type: Number, default: 0 })
  totalCost: number; // in MNT ₮

  @Prop({ default: 'MNT' })
  currency: string;

  @Prop({ required: true, enum: ItineraryStatus, default: ItineraryStatus.DRAFT, index: true })
  status: ItineraryStatus;

  @Prop({ type: [ItineraryDaySchema], default: [] })
  days: ItineraryDaySubdoc[];
}

export const ItinerarySchema = SchemaFactory.createForClass(Itinerary);
