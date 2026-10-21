import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttractionDocument = Attraction & Document;

export enum AttractionCategory {
  NATURE = 'nature',
  HISTORICAL = 'historical',
  CULTURAL = 'cultural',
  ADVENTURE = 'adventure',
  CITY = 'city',
  CULINARY = 'culinary',
}

@Schema({ timestamps: true, collection: 'attractions' })
export class Attraction {
  @Prop({ type: Types.ObjectId, ref: 'Destination', required: true, index: true })
  destinationId: Types.ObjectId;

  @Prop({ required: true, index: true })
  destinationKey: string; // 'beijing'

  @Prop({ required: true })
  name: string; // 'Цагаан хэрэм'

  @Prop({ required: false })
  nameEn?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: String, index: true })
  category: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: false })
  cityOrSum?: string;

  @Prop({ type: Number, default: 0 })
  estimatedCost: number; // in MNT ₮

  @Prop({ type: Number, default: 2.0 })
  estimatedHours: number;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: Number, default: 5.0 })
  rating: number;

  @Prop({ type: [String], default: [] })
  highlights: string[];

  @Prop({ type: [String], default: [] })
  bestSeason: string[];
}

export const AttractionSchema = SchemaFactory.createForClass(Attraction);
