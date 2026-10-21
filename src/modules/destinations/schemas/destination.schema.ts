import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DestinationDocument = Destination & Document;

@Schema({ timestamps: true, collection: 'destinations' })
export class Destination {
  @Prop({ required: true, unique: true, index: true })
  key: string; // e.g. 'beijing', 'tokyo', 'khuvsgul'

  @Prop({ required: true })
  name: string; // 'Бээжин хот'

  @Prop({ required: true })
  country: string; // 'Хятад'

  @Prop({ required: true, index: true })
  countryKey: string; // 'china'

  @Prop({ required: true })
  flag: string; // '🇨🇳'

  @Prop({ required: true })
  tag: string; // 'Түүх соёл, дэлгүүр'

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ default: false, index: true })
  popular: boolean;
}

export const DestinationSchema = SchemaFactory.createForClass(Destination);
