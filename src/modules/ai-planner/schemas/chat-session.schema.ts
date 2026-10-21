import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface GeneratedPlanSnapshot {
  readonly city: {
    readonly key: string;
    readonly name: string;
    readonly country: string;
    readonly flag: string;
    readonly tag?: string;
  };
  readonly days: number;
  readonly nightsCount: number;
  readonly travelers: number;
  readonly hotelTierStars: number;
  readonly selectedHotel?: {
    readonly id?: string;
    readonly name?: string;
    readonly starRating?: number;
    readonly pricePerNight?: number;
  } | null | undefined;
  readonly selectedAttractions?: readonly {
    readonly id?: string;
    readonly name: string;
    readonly category?: string;
    readonly estimatedCost?: number;
  }[];
  readonly selectedTransport?: {
    readonly id?: string;
    readonly title?: string;
    readonly type?: string;
    readonly pricePerPerson?: number;
  } | null | undefined;
  readonly hotelTotalCost?: number;
  readonly attractionsTotalCost?: number;
  readonly transportTotalCost?: number;
  readonly grandTotalCost: number;
  readonly perPersonCost: number;
  readonly itinerary: readonly {
    readonly day: number;
    readonly title: string;
    readonly activities: readonly string[];
  }[];
}

@Schema({ _id: true, timestamps: true })
export class ChatMessageSubdoc {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true, enum: MessageRole })
  role: MessageRole;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object, required: false })
  planSnapshot?: GeneratedPlanSnapshot | undefined;

  @Prop({ type: [String], default: [] })
  quickSuggestions: string[];
}
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessageSubdoc);

@Schema({ timestamps: true, collection: 'chat_sessions' })
export class ChatSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, default: 'Шинэ аяллын яриа' })
  title: string;

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessageSubdoc[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
